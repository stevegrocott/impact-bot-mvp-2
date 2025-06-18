/**
 * IRIS+ Framework Controller
 * Handles IRIS+ data retrieval and search operations
 */

import { Request, Response } from 'express';
import { irisService } from '@/services/irisService';

export class IrisController {
  
  /**
   * Get IRIS+ statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    const stats = await irisService.getStatistics();
    res.json(stats);
  }

  /**
   * Get all impact categories with hierarchy
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    const categories = await irisService.getCategories();
    res.json(categories);
  }

  /**
   * Get impact themes by category
   */
  async getThemes(req: Request, res: Response): Promise<void> {
    const { categoryId } = req.params;
    const themes = await irisService.getThemesByCategory(categoryId);
    res.json(themes);
  }

  /**
   * Get strategic goals
   */
  async getStrategicGoals(req: Request, res: Response): Promise<void> {
    const goals = await irisService.getStrategicGoals();
    res.json(goals);
  }

  /**
   * Get key indicators with filtering
   */
  async getKeyIndicators(req: Request, res: Response): Promise<void> {
    const {
      category,
      theme,
      goal,
      complexity,
      search,
      limit = 50,
      offset = 0
    } = req.query;

    const filters = {
      category: category as string,
      theme: theme as string,
      goal: goal as string,
      complexity: complexity as string,
      search: search as string
    };

    const indicators = await irisService.getKeyIndicators(
      filters,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json(indicators);
  }

  /**
   * Get a specific indicator by ID
   */
  async getIndicatorById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const indicator = await irisService.getIndicatorById(id);
    
    if (!indicator) {
      res.status(404).json({ error: 'Indicator not found' });
      return;
    }
    
    res.json(indicator);
  }

  /**
   * Search indicators using vector similarity
   */
  async searchIndicators(req: Request, res: Response): Promise<void> {
    const { query, limit = 20 } = req.body;
    
    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const results = await irisService.searchSimilarIndicators(
      query,
      parseInt(limit as string)
    );
    
    res.json(results);
  }

  /**
   * Get recommendations based on context
   */
  async getRecommendations(req: Request, res: Response): Promise<void> {
    const { context, organizationId } = req.body;
    
    if (!context) {
      res.status(400).json({ error: 'Context is required' });
      return;
    }

    const recommendations = await irisService.getContextualRecommendations(
      context,
      organizationId
    );
    
    res.json(recommendations);
  }
}

// Export controller instance
export const irisController = new IrisController();