// src/hooks/useMealPlanGeneration.ts
import { useState, useCallback } from 'react';
import { 
  generateMealPlan, 
  GenerationOptions, 
  GenerationResult,
  QualityMetrics 
} from '../services/mealPlanGenerator';
import { useUserStore } from '../stores/userStore';
import { useMealStore } from '../stores/mealStore';

export interface GenerationProgress {
  isGenerating: boolean;
  currentStage: string;
  completion: number; // 0-100
  stageDetails: {
    recipesFiltered?: number;
    recipesEvaluated?: number;
    constraintsChecked?: number;
    optimizationIterations?: number;
  };
  estimatedTimeRemaining?: number; // seconds
}

export interface GenerationState {
  lastResult?: GenerationResult;
  lastError?: string;
  generationHistory: GenerationResult[];
  qualityTrend: QualityMetrics[];
}

export const useMealPlanGeneration = () => {
  // ===== STATE =====
  const [progress, setProgress] = useState<GenerationProgress>({
    isGenerating: false,
    currentStage: 'idle',
    completion: 0,
    stageDetails: {}
  });

  const [generationState, setGenerationState] = useState<GenerationState>({
    generationHistory: [],
    qualityTrend: []
  });

  // ===== STORES =====
  const selectedUser = useUserStore(state => state.selectedUser);
  const { addMeal, setMealPlans, getMealPlan } = useMealStore();

  // ===== GENERATION METHODS =====

  /**
   * Generate meal plan for a specific day
   */
  const generateDayPlan = useCallback(async (
    date: string,
    options?: Partial<GenerationOptions>
  ): Promise<GenerationResult> => {
    if (!selectedUser) {
      throw new Error('No user selected for meal plan generation');
    }

    // Validate user has required data
    if (!selectedUser.tdci?.adjustedTDCI) {
      throw new Error('User must complete TDCI setup before generating meal plans');
    }

    if (!selectedUser.mealPreferences) {
      throw new Error('User must set meal preferences before generating meal plans');
    }

    setProgress({
      isGenerating: true,
      currentStage: 'initializing',
      completion: 0,
      stageDetails: {}
    });

    try {
      const generationOptions: GenerationOptions = {
        user: selectedUser,
        date,
        mode: 'balanced',
        weekPlan: false,
        preferences: {
          avoidIngredients: selectedUser.avoidMeals || [],
          varietyLevel: 'medium',
          maxPrepTime: 60, // default max prep time
          ...options?.preferences
        },
        ...options
      };

      // Simulate progressive updates during generation
      const stages = [
        { name: 'pre-filtering', completion: 20 },
        { name: 'optimization', completion: 50 },
        { name: 'constraint-satisfaction', completion: 75 },
        { name: 'local-search', completion: 90 },
        { name: 'finalization', completion: 100 }
      ];

      // Update progress through stages (this will be replaced with real progress tracking)
      for (const stage of stages) {
        setProgress(prev => ({
          ...prev,
          currentStage: stage.name,
          completion: stage.completion
        }));
        
        // Small delay to show progress (remove in production)
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const result = await generateMealPlan(generationOptions);

      // Update generation state
      setGenerationState(prev => ({
        lastResult: result,
        lastError: result.success ? undefined : result.error,
        generationHistory: [...prev.generationHistory, result].slice(-10), // Keep last 10
        qualityTrend: [...prev.qualityTrend, result.quality].slice(-20) // Keep last 20
      }));

      // If successful, update meal store
      if (result.success && result.mealPlan) {
        // Clear existing meals for this day
        const existingMealPlan = getMealPlan(selectedUser.id, date);
        if (existingMealPlan) {
          // TODO: Clear existing meals
        }

        // Add generated meals
        result.mealPlan.meals.forEach(meal => {
          addMeal(selectedUser.id, date, {
            type: meal.type,
            name: meal.name,
            position: meal.position
          });
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setGenerationState(prev => ({
        ...prev,
        lastError: errorMessage
      }));

      throw error;
    } finally {
      setProgress({
        isGenerating: false,
        currentStage: 'complete',
        completion: 100,
        stageDetails: {}
      });
    }
  }, [selectedUser, addMeal, setMealPlans, getMealPlan]);

  /**
   * Generate meal plan for entire week
   */
  const generateWeekPlan = useCallback(async (
    startDate: string,
    options?: Partial<GenerationOptions>
  ): Promise<GenerationResult> => {
    if (!selectedUser) {
      throw new Error('No user selected for meal plan generation');
    }

    setProgress({
      isGenerating: true,
      currentStage: 'week-planning',
      completion: 0,
      stageDetails: {}
    });

    try {
      const generationOptions: GenerationOptions = {
        user: selectedUser,
        date: startDate,
        mode: 'quality', // Use highest quality for week planning
        weekPlan: true,
        preferences: {
          avoidIngredients: selectedUser.avoidMeals || [],
          varietyLevel: 'high', // Higher variety for week plans
          maxPrepTime: 60,
          ...options?.preferences
        },
        ...options
      };

      const result = await generateMealPlan(generationOptions);

      // Update state
      setGenerationState(prev => ({
        lastResult: result,
        lastError: result.success ? undefined : result.error,
        generationHistory: [...prev.generationHistory, result].slice(-10),
        qualityTrend: [...prev.qualityTrend, result.quality].slice(-20)
      }));

      // If successful, update meal store for all days
      if (result.success && result.weekPlan) {
        result.weekPlan.forEach(dayPlan => {
          dayPlan.meals.forEach(meal => {
            addMeal(selectedUser.id, dayPlan.date, {
              type: meal.type,
              name: meal.name,
              position: meal.position
            });
          });
        });
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setGenerationState(prev => ({
        ...prev,
        lastError: errorMessage
      }));

      throw error;
    } finally {
      setProgress({
        isGenerating: false,
        currentStage: 'complete',
        completion: 100,
        stageDetails: {}
      });
    }
  }, [selectedUser, addMeal]);

  /**
   * Quick generation with default settings
   */
  const quickGenerate = useCallback(async (date: string): Promise<GenerationResult> => {
    return generateDayPlan(date, { mode: 'speed' });
  }, [generateDayPlan]);

  /**
   * High-quality generation (slower but better results)
   */
  const qualityGenerate = useCallback(async (date: string): Promise<GenerationResult> => {
    return generateDayPlan(date, { mode: 'quality' });
  }, [generateDayPlan]);

  /**
   * Cancel ongoing generation
   */
  const cancelGeneration = useCallback(() => {
    // TODO: Implement generation cancellation
    setProgress({
      isGenerating: false,
      currentStage: 'cancelled',
      completion: 0,
      stageDetails: {}
    });
  }, []);

  /**
   * Clear generation history
   */
  const clearHistory = useCallback(() => {
    setGenerationState({
      generationHistory: [],
      qualityTrend: []
    });
  }, []);

  // ===== COMPUTED VALUES =====
  const isGenerating = progress.isGenerating;
  const canGenerate = !!selectedUser && !!selectedUser.tdci?.adjustedTDCI && !!selectedUser.mealPreferences;
  const lastQuality = generationState.lastResult?.quality;
  const averageQuality = generationState.qualityTrend.length > 0 
    ? generationState.qualityTrend.reduce((sum, q) => sum + q.overall, 0) / generationState.qualityTrend.length
    : 0;

  return {
    // Generation methods
    generateDayPlan,
    generateWeekPlan,
    quickGenerate,
    qualityGenerate,
    cancelGeneration,
    
    // State
    progress,
    generationState,
    isGenerating,
    canGenerate,
    
    // Quality metrics
    lastQuality,
    averageQuality,
    qualityTrend: generationState.qualityTrend,
    
    // Utility
    clearHistory,
    
    // Error state
    lastError: generationState.lastError
  };
};

export default useMealPlanGeneration;