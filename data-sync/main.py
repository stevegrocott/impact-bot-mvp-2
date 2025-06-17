#!/usr/bin/env python3
"""
Production Data Sync Service for Impact Bot v2
Optimized Airtable to PostgreSQL synchronization with proper error handling
"""

import os
import sys
import time
import schedule
import logging
import structlog
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

from airtable_sync import AirtableSync
from database import Database

class DataSyncService:
    def __init__(self):
        self.database = Database()
        self.airtable_sync = AirtableSync(self.database)
        self.sync_schedule = os.getenv('SYNC_SCHEDULE', '0 2 * * *')  # Default: Daily at 2 AM
        
    def run_full_sync(self):
        """Run complete Airtable synchronization"""
        logger.info("Starting full Airtable synchronization")
        
        try:
            # Record sync start
            sync_id = self.database.start_sync_record('airtable_full')
            
            # Run synchronization
            result = self.airtable_sync.sync_all()
            
            # Record sync completion
            self.database.complete_sync_record(
                sync_id, 
                records_processed=result['total_records'],
                records_updated=result['updated_records'],
                records_created=result['created_records']
            )
            
            logger.info("Full synchronization completed successfully", **result)
            
        except Exception as e:
            logger.error("Full synchronization failed", error=str(e), exc_info=True)
            if 'sync_id' in locals():
                self.database.fail_sync_record(sync_id, str(e))
            raise
    
    def run_delta_sync(self):
        """Run incremental synchronization (changed records only)"""
        logger.info("Starting delta Airtable synchronization")
        
        try:
            # Get last successful sync timestamp
            last_sync = self.database.get_last_successful_sync('airtable_delta')
            
            # Record sync start
            sync_id = self.database.start_sync_record('airtable_delta')
            
            # Run delta synchronization
            result = self.airtable_sync.sync_changes_since(last_sync)
            
            # Record sync completion
            self.database.complete_sync_record(
                sync_id,
                records_processed=result['total_records'],
                records_updated=result['updated_records'],
                records_created=result['created_records']
            )
            
            logger.info("Delta synchronization completed successfully", **result)
            
        except Exception as e:
            logger.error("Delta synchronization failed", error=str(e), exc_info=True)
            if 'sync_id' in locals():
                self.database.fail_sync_record(sync_id, str(e))
            raise
    
    def refresh_materialized_views(self):
        """Refresh all materialized views after sync"""
        logger.info("Refreshing materialized views")
        
        try:
            self.database.refresh_materialized_views()
            logger.info("Materialized views refreshed successfully")
        except Exception as e:
            logger.error("Failed to refresh materialized views", error=str(e), exc_info=True)
            raise
    
    def health_check(self):
        """Perform health check of sync service"""
        try:
            # Check database connection
            self.database.health_check()
            
            # Check Airtable connectivity
            self.airtable_sync.health_check()
            
            # Check last sync status
            last_sync = self.database.get_last_sync_status()
            if last_sync and last_sync['status'] == 'failed':
                logger.warning("Last sync failed", last_sync=last_sync)
                return False
            
            logger.info("Health check passed")
            return True
            
        except Exception as e:
            logger.error("Health check failed", error=str(e), exc_info=True)
            return False
    
    def setup_scheduler(self):
        """Set up scheduled sync jobs"""
        # Parse cron-like schedule (simplified - daily at specified hour)
        # For production, consider using a proper cron scheduler like APScheduler
        schedule.every().day.at("02:00").do(self.run_full_sync)
        schedule.every().hour.do(self.run_delta_sync)
        schedule.every(30).minutes.do(self.health_check)
        
        logger.info("Sync scheduler configured", schedule=self.sync_schedule)
    
    def run_continuous(self):
        """Run continuous sync service with scheduling"""
        logger.info("Starting continuous data sync service")
        
        # Initial health check
        if not self.health_check():
            logger.error("Initial health check failed, exiting")
            sys.exit(1)
        
        # Setup scheduler
        self.setup_scheduler()
        
        # Run initial sync if needed
        last_sync = self.database.get_last_successful_sync('airtable_full')
        if not last_sync or (datetime.now() - last_sync).days > 1:
            logger.info("Running initial full sync")
            self.run_full_sync()
            self.refresh_materialized_views()
        
        # Start scheduler loop
        logger.info("Data sync service started, waiting for scheduled jobs")
        
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("Received shutdown signal, stopping data sync service")
                break
            except Exception as e:
                logger.error("Scheduler error", error=str(e), exc_info=True)
                time.sleep(300)  # Wait 5 minutes before retrying
    
    def run_once(self, sync_type='full'):
        """Run sync once and exit (for manual/cron execution)"""
        logger.info("Running one-time sync", sync_type=sync_type)
        
        if sync_type == 'full':
            self.run_full_sync()
            self.refresh_materialized_views()
        elif sync_type == 'delta':
            self.run_delta_sync()
            self.refresh_materialized_views()
        elif sync_type == 'views':
            self.refresh_materialized_views()
        else:
            logger.error("Unknown sync type", sync_type=sync_type)
            sys.exit(1)
        
        logger.info("One-time sync completed")

def main():
    """Main entry point"""
    
    # Configure logging to file
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / 'data-sync.log'),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Create sync service
    sync_service = DataSyncService()
    
    # Determine run mode from command line args
    if len(sys.argv) > 1:
        mode = sys.argv[1]
        if mode in ['full', 'delta', 'views']:
            sync_service.run_once(mode)
        elif mode == 'health':
            success = sync_service.health_check()
            sys.exit(0 if success else 1)
        else:
            logger.error("Unknown command", command=mode)
            logger.info("Usage: python main.py [full|delta|views|health]")
            sys.exit(1)
    else:
        # Run continuous service
        sync_service.run_continuous()

if __name__ == "__main__":
    main()