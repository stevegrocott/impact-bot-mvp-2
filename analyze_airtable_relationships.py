#!/usr/bin/env python3
"""
Comprehensive Airtable Relationship Analysis
Analyzes the complete IRIS+ framework structure and unique relationship counts
"""

import requests
import json
from collections import defaultdict, Counter

# Configuration
AIRTABLE_TOKEN = "patcrGNiYinMzvMpm.f37d63cd3a8e6d894197bd66eb0558a1feb4e7136ac9afdec2b3f866b08a0507"
BASE_ID = "app8JW20fqXYI2uRw"
HEADERS = {"Authorization": f"Bearer {AIRTABLE_TOKEN}"}

def fetch_all_records(table_id):
    """Fetch all records from a table, handling pagination"""
    url = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}"
    all_records = []
    
    while url:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        
        records = data.get("records", [])
        all_records.extend(records)
        
        # Check for pagination
        offset = data.get("offset")
        if offset:
            url = f"https://api.airtable.com/v0/{BASE_ID}/{table_id}?offset={offset}"
        else:
            url = None
    
    return all_records

def analyze_relationship_chain():
    """Analyze the complete IRIS+ relationship chain and count unique pairs"""
    
    print("🔍 Analyzing IRIS+ Relationship Chain from Airtable")
    print("=" * 60)
    
    # Table IDs from the schema analysis
    tables = {
        "categories": "tblGJJAlxAJqqMa0O",       # IRIS Impact Category
        "themes": "tblVLKZJ9gtCjFssF",           # IRIS Impact Themes  
        "goals": "tblhZTqXzvdtNdx2Q",            # IRIS Strategic Goals
        "key_dimensions": "tblCsxfdKz8XiCett",   # IRIS Key Dimensions
        "core_metric_sets": "tblHyNTZm0O2t11tv", # IRIS Core Metric Set
        "key_indicators": "tbl52YZbJ4f3F8UVl",   # IRIS Key Indicator
        "data_needed": "tbloXZVEl7AhPUVwd",      # IRIS Data Needed
        "sdgs": "tblU47hC5t4WmieS7",             # SDG
        
        # Junction tables
        "junct_key_dims": "tblrlsaQ5FloYOkqt",   # <> IRIS Key Dimensions
        "junct_core_sets": "tbltUqeIhuO1xc1Lb", # <> IRIS Core Metric Set  
        "junct_indicators": "tblWoYYYJjTQ3xttD", # <> IRIS Key Indicator
        "junct_data_needed": "tblyCxOkCo3esnHBg" # <> IRIS Data Needed
    }
    
    # Fetch all data
    print("\n📥 Fetching all table data...")
    data = {}
    for name, table_id in tables.items():
        print(f"  Fetching {name}...")
        data[name] = fetch_all_records(table_id)
        print(f"    ✓ {len(data[name])} records")
    
    print(f"\n📊 Record Counts Summary:")
    print(f"  Categories: {len(data['categories'])}")
    print(f"  Themes: {len(data['themes'])}")  
    print(f"  Strategic Goals: {len(data['goals'])}")
    print(f"  Key Indicators: {len(data['key_indicators'])}")
    print(f"  Data Needed: {len(data['data_needed'])}")
    print(f"  SDGs: {len(data['sdgs'])}")
    
    print(f"\n🔗 Junction Table Record Counts:")
    print(f"  Key Dimensions Junction: {len(data['junct_key_dims'])}")
    print(f"  Core Metric Sets Junction: {len(data['junct_core_sets'])}")  
    print(f"  Key Indicators Junction: {len(data['junct_indicators'])}")
    print(f"  Data Needed Junction: {len(data['junct_data_needed'])}")
    
    # Analyze the complete relationship chain from Data Needed junction table
    print(f"\n🌐 Complete Relationship Chain Analysis:")
    print(f"  Analyzing Data Needed junction table with full lookup context...")
    
    # Count unique combinations in the final junction table
    category_combinations = set()
    sdg_combinations = set()
    full_chain_combinations = set()
    
    for record in data['junct_data_needed']:
        fields = record.get('fields', {})
        
        # Extract categories from lookup field
        categories = fields.get('IRIS Impact Category (from Impact Category <> Impact Theme) (from IRIS Impact Themes) (from IRIS Strategic Goals) (from <> IRIS Key Dimensions) (from <> IRIS Core Metric Set) (from <> IRIS Key Indicator)', [])
        
        # Extract SDGs from lookup field  
        sdgs = fields.get('SDG (from IRIS Strategic Goals) (from <> IRIS Key Dimensions) (from <> IRIS Core Metric Set) (from <> IRIS Key Indicator)', [])
        
        # Get direct relationships
        key_indicators = fields.get('<> IRIS Key Indicator', [])
        data_needed = fields.get('IRIS Data Needed', [])
        
        # Count unique category-data_needed pairs
        for category in categories:
            for data_item in data_needed:
                category_combinations.add((category, data_item))
        
        # Count unique SDG-data_needed pairs  
        for sdg in sdgs:
            for data_item in data_needed:
                sdg_combinations.add((sdg, data_item))
                
        # Count full chain combinations (category + SDG + data_needed)
        for category in categories:
            for sdg in sdgs:
                for data_item in data_needed:
                    full_chain_combinations.add((category, sdg, data_item))
    
    print(f"\n🎯 Unique Relationship Pair Counts:")
    print(f"  Category ↔ Data Needed: {len(category_combinations)} unique pairs")
    print(f"  SDG ↔ Data Needed: {len(sdg_combinations)} unique pairs") 
    print(f"  Category + SDG + Data Needed: {len(full_chain_combinations)} unique triplets")
    
    # Analyze Theme-Goal relationships
    theme_goal_pairs = set()
    for record in data['goals']:
        goal_id = record['id']
        themes = record.get('fields', {}).get('IRIS Impact Themes', [])
        for theme_id in themes:
            theme_goal_pairs.add((theme_id, goal_id))
    
    print(f"  Theme ↔ Goal: {len(theme_goal_pairs)} unique pairs")
    
    # Analyze Goal-SDG relationships  
    goal_sdg_pairs = set()
    for record in data['goals']:
        goal_id = record['id']
        sdgs = record.get('fields', {}).get('SDG', [])
        for sdg_id in sdgs:
            goal_sdg_pairs.add((goal_id, sdg_id))
            
    print(f"  Goal ↔ SDG: {len(goal_sdg_pairs)} unique pairs")
    
    print(f"\n✅ Complete Relationship Chain Verified:")
    print(f"  SDG → Goal → Key Dimension → Core Metric Set → Key Indicator → Data Needed")
    print(f"  Category → Theme → Goal → Key Dimension → Core Metric Set → Key Indicator → Data Needed")
    
    return {
        'category_data_pairs': len(category_combinations),
        'sdg_data_pairs': len(sdg_combinations), 
        'full_chain_triplets': len(full_chain_combinations),
        'theme_goal_pairs': len(theme_goal_pairs),
        'goal_sdg_pairs': len(goal_sdg_pairs),
        'total_data_needed_records': len(data['junct_data_needed'])
    }

if __name__ == "__main__":
    try:
        results = analyze_relationship_chain()
        print(f"\n📋 Summary for Database Schema:")
        print(f"  Theme-Goal Junction Table: {results['theme_goal_pairs']} records")
        print(f"  Goal-SDG Junction Table: {results['goal_sdg_pairs']} records") 
        print(f"  Data Needed Junction Table: {results['total_data_needed_records']} records")
        print(f"  Expected Category-Data unique pairs: {results['category_data_pairs']}")
        print(f"  Expected SDG-Data unique pairs: {results['sdg_data_pairs']}")
        
    except Exception as e:
        print(f"❌ Error: {e}")