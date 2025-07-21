// src/services/mealPlanGenerator/preparation/ValidationHelpers.ts
// 🔧 PHASE 1.1: ENHANCED with Portion Sizes Validation & Better Error Handling

import { User } from '../../../stores/userStore';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  score: number; // 0-100, higher is better
}

export interface PortionSizesValidation extends ValidationResult {
  totalPortionWeight: number;
  distributionAnalysis: {
    mainMealsTotal: number;
    snacksTotal: number;
    isBalanced: boolean;
  };
  recommendations: string[];
}

/**
 * Enhanced validation helpers with portion sizes support
 * Implements comprehensive user profile validation for meal generation
 */
export class ValidationHelpers {
  
  /**
   * ✅ ENHANCED: Comprehensive user profile validation with portion sizes
   */
  static validateUserProfile(user: User): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    let score = 100;

    console.log('🔍 Validating user profile for meal generation...');

    // Basic profile validation
    if (!user) {
      return {
        isValid: false,
        errors: ['User profile is null or undefined'],
        warnings: [],
        missingFields: ['user'],
        score: 0
      };
    }

    if (!user.id) {
      errors.push('User ID is required');
      missingFields.push('id');
      score -= 20;
    }

    // ✅ TDCI validation with better error handling
    if (!user.tdci) {
      errors.push('TDCI calculation is required for meal planning');
      missingFields.push('tdci');
      score -= 30;
    } else {
      if (!user.tdci.adjustedTDCI) {
        errors.push('Adjusted TDCI is required');
        missingFields.push('tdci.adjustedTDCI');
        score -= 25;
      }
      
      if (user.tdci.adjustedTDCI && (user.tdci.adjustedTDCI < 1000 || user.tdci.adjustedTDCI > 5000)) {
        warnings.push(`TDCI of ${user.tdci.adjustedTDCI} calories seems unusual`);
        score -= 5;
      }
    }

    // ✅ MEAL PREFERENCES validation (critical for portion sizes)
    if (!user.mealPreferences) {
      errors.push('Meal preferences are required');
      missingFields.push('mealPreferences');
      score -= 25;
    } else {
      if (!user.mealPreferences.snackPositions) {
        warnings.push('No snack positions defined');
        score -= 5;
      } else if (user.mealPreferences.snackPositions.length > 5) {
        warnings.push('More than 5 snacks per day may be excessive');
        score -= 5;
      }
    }

    // ✅ ENHANCED: Portion sizes validation (PHASE 1.1 focus)
    const portionValidation = this.validatePortionSizes(user);
    if (!portionValidation.isValid) {
      errors.push(...portionValidation.errors);
      score -= 20;
    }
    warnings.push(...portionValidation.warnings);
    if (portionValidation.warnings.length > 0) {
      score -= Math.min(10, portionValidation.warnings.length * 2);
    }

    // ✅ PHYSICAL DATA validation with parseFloat support
    if (!user.age) {
      warnings.push('Age not set');
      missingFields.push('age');
      score -= 5;
    } else {
      const ageNum = parseFloat(user.age);
      if (isNaN(ageNum) || ageNum < 12 || ageNum > 120) {
        warnings.push(`Age of ${user.age} seems unusual`);
        score -= 3;
      }
    }

    if (!user.weight) {
      warnings.push('Weight not set');
      missingFields.push('weight');
      score -= 5;
    } else {
      const weightNum = parseFloat(user.weight);
      if (isNaN(weightNum) || weightNum < 30 || weightNum > 300) {
        warnings.push(`Weight of ${user.weight}kg seems unusual`);
        score -= 3;
      }
    }

    if (!user.height) {
      warnings.push('Height not set');
      missingFields.push('height');
      score -= 5;
    } else {
      const heightNum = parseFloat(user.height);
      if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
        warnings.push(`Height of ${user.height}cm seems unusual`);
        score -= 3;
      }
    }

    if (!user.bodyFat) {
      warnings.push('Body fat percentage not set');
      missingFields.push('bodyFat');
      score -= 5;
    } else {
      const bodyFatNum = parseFloat(user.bodyFat);
      const minBodyFat = user.gender === 'Male' ? 8 : 15;
      const maxBodyFat = user.gender === 'Male' ? 35 : 45;
      
      if (isNaN(bodyFatNum) || bodyFatNum < minBodyFat || bodyFatNum > maxBodyFat) {
        warnings.push(`Body fat of ${user.bodyFat}% seems unusual for ${user.gender}`);
        score -= 3;
      }
    }

    // Gender validation
    if (!user.gender) {
      warnings.push('Gender not specified, using Male as default');
      missingFields.push('gender');
      score -= 3;
    }

    // ✅ ACTIVITY LEVEL validation (optional field from userStore)
    // Note: activityLevel doesn't exist on User type, but activityMultiplier does
    if (!user.activityMultiplier) {
      warnings.push('Activity multiplier not set');
      missingFields.push('activityMultiplier');
      score -= 5;
    } else if (user.activityMultiplier < 1.2 || user.activityMultiplier > 2.2) {
      warnings.push(`Activity multiplier ${user.activityMultiplier} seems unusual (normal range: 1.2-2.2)`);
      score -= 3;
    }

    // ✅ DIETARY RESTRICTIONS validation
    if (user.avoidMeals && user.avoidMeals.length > 10) {
      warnings.push('Very restrictive diet with many avoided foods');
      score -= 5;
    }

    const finalScore = Math.max(0, Math.min(100, score));
    const isValid = errors.length === 0 && finalScore >= 60;

    console.log('✅ User profile validation result:', {
      isValid,
      score: finalScore,
      errorsCount: errors.length,
      warningsCount: warnings.length
    });

    return {
      isValid,
      errors,
      warnings,
      missingFields,
      score: finalScore
    };
  }

  /**
   * ✅ NEW: Comprehensive portion sizes validation (PHASE 1.1 focus)
   */
  static validatePortionSizes(user: User): PortionSizesValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    console.log('🔍 Validating portion sizes configuration...');

    if (!user.portionSizes) {
      warnings.push('Portion sizes not configured, using defaults');
      missingFields.push('portionSizes');
      score -= 15;
      
      return {
        isValid: true, // Not critical error, defaults will be used
        errors,
        warnings,
        missingFields,
        score,
        totalPortionWeight: 1.0, // Default total
        distributionAnalysis: {
          mainMealsTotal: 0.75,
          snacksTotal: 0.25,
          isBalanced: true
        },
        recommendations: ['Configure custom portion sizes for better meal targeting']
      };
    }

    const portionSizes = user.portionSizes;
    console.log('📊 Analyzing portion sizes:', portionSizes);

    // ✅ MAIN MEALS validation
    const requiredMainMeals = ['Breakfast', 'Lunch', 'Dinner'];
    let mainMealsTotal = 0;

    requiredMainMeals.forEach(meal => {
      const lowerKey = meal.toLowerCase();
      const portion = portionSizes[meal] ?? portionSizes[lowerKey];
      
      if (portion === undefined) {
        warnings.push(`Missing portion size for ${meal}`);
        missingFields.push(`portionSizes.${lowerKey}`);
        score -= 5;
      } else {
        mainMealsTotal += portion;
        
        // Individual meal validation
        if (portion < 0.1) {
          warnings.push(`Very small portion size for ${meal}: ${portion.toFixed(2)}`);
          score -= 3;
        } else if (portion > 1.0) {
          warnings.push(`Very large portion size for ${meal}: ${portion.toFixed(2)}`);
          score -= 3;
        } else if (portion <= 0) {
          errors.push(`Invalid portion size for ${meal}: ${portion}`);
          score -= 10;
        }
        
        // Reasonable range recommendations
        if (portion < 0.15 || portion > 0.5) {
          recommendations.push(`Consider adjusting ${meal} portion size (recommended: 0.15-0.5)`);
        }
      }
    });

    // ✅ SNACKS validation based on snackPositions
    let snacksTotal = 0;
    const snackPositions = user.mealPreferences?.snackPositions || [];
    
    if (snackPositions.length > 0) {
      // Check general snack portion size
      if (portionSizes.snack !== undefined) {
        const snackPortion = portionSizes.snack;
        snacksTotal = snackPortion * snackPositions.length; // Total across all snack positions
        
        if (snackPortion < 0.05) {
          warnings.push(`Very small snack portion size: ${snackPortion.toFixed(2)}`);
          score -= 2;
        } else if (snackPortion > 0.25) {
          warnings.push(`Large snack portion size: ${snackPortion.toFixed(2)}`);
          score -= 2;
        } else if (snackPortion <= 0) {
          errors.push(`Invalid snack portion size: ${snackPortion}`);
          score -= 8;
        }
      } else {
        // Check individual snack position portion sizes
        snackPositions.forEach((position: string) => {
          const snackPortion = portionSizes[position];
          if (snackPortion !== undefined) {
            snacksTotal += snackPortion;
            
            if (snackPortion < 0.05) {
              warnings.push(`Very small portion for ${position}: ${snackPortion.toFixed(2)}`);
              score -= 2;
            } else if (snackPortion > 0.25) {
              warnings.push(`Large portion for ${position}: ${snackPortion.toFixed(2)}`);
              score -= 2;
            } else if (snackPortion <= 0) {
              errors.push(`Invalid portion size for ${position}: ${snackPortion}`);
              score -= 8;
            }
          } else {
            warnings.push(`Missing portion size for snack position: ${position}`);
            missingFields.push(`portionSizes.${position}`);
            score -= 3;
          }
        });
        
        if (snacksTotal === 0) {
          warnings.push('No snack portion sizes configured');
          score -= 5;
        }
      }
    }

    // ✅ TOTAL PORTION WEIGHT analysis
    const totalPortionWeight = mainMealsTotal + snacksTotal;
    
    console.log('📊 Portion distribution analysis:', {
      mainMealsTotal: mainMealsTotal.toFixed(2),
      snacksTotal: snacksTotal.toFixed(2),
      totalPortionWeight: totalPortionWeight.toFixed(2)
    });

    // Total weight validation
    if (totalPortionWeight < 0.7) {
      warnings.push(`Total portion weight seems low: ${totalPortionWeight.toFixed(2)}`);
      recommendations.push('Consider increasing portion sizes to meet daily calorie needs');
      score -= 5;
    } else if (totalPortionWeight > 1.5) {
      warnings.push(`Total portion weight seems high: ${totalPortionWeight.toFixed(2)}`);
      recommendations.push('Consider reducing portion sizes to avoid overeating');
      score -= 5;
    }

    // ✅ DISTRIBUTION BALANCE analysis
    const isBalanced = this.analyzePortionBalance(mainMealsTotal, snacksTotal, totalPortionWeight);
    if (!isBalanced.isBalanced) {
      if (isBalanced.issue) warnings.push(isBalanced.issue);
      if (isBalanced.recommendation) recommendations.push(isBalanced.recommendation);
      score -= 3;
    }

    // ✅ CONSISTENCY validation
    const consistencyIssues = this.checkPortionConsistency(portionSizes, requiredMainMeals);
    warnings.push(...consistencyIssues.warnings);
    recommendations.push(...consistencyIssues.recommendations);
    score -= consistencyIssues.penaltyPoints;

    const finalScore = Math.max(0, Math.min(100, score));
    const isValid = errors.length === 0;

    console.log('✅ Portion sizes validation result:', {
      isValid,
      score: finalScore,
      totalPortionWeight: totalPortionWeight.toFixed(2),
      mainMealsTotal: mainMealsTotal.toFixed(2),
      snacksTotal: snacksTotal.toFixed(2)
    });

    return {
      isValid,
      errors,
      warnings,
      missingFields,
      score: finalScore,
      totalPortionWeight,
      distributionAnalysis: {
        mainMealsTotal,
        snacksTotal,
        isBalanced: isBalanced.isBalanced
      },
      recommendations
    };
  }

  /**
   * ✅ NEW: Analyze portion balance between main meals and snacks
   */
  private static analyzePortionBalance(
    mainMealsTotal: number, 
    snacksTotal: number, 
    totalWeight: number
  ): { isBalanced: boolean; issue?: string; recommendation?: string } {
    
    if (totalWeight === 0) {
      return {
        isBalanced: false,
        issue: 'No portion sizes configured',
        recommendation: 'Configure portion sizes for all meals'
      };
    }

    const mainMealPercentage = mainMealsTotal / totalWeight;
    const snackPercentage = snacksTotal / totalWeight;

    // Main meals should typically be 60-85% of total intake
    if (mainMealPercentage < 0.6) {
      return {
        isBalanced: false,
        issue: `Main meals too small (${(mainMealPercentage * 100).toFixed(0)}% of total)`,
        recommendation: 'Increase main meal portions or reduce snack portions'
      };
    }

    if (mainMealPercentage > 0.9) {
      return {
        isBalanced: false,
        issue: `Main meals too large (${(mainMealPercentage * 100).toFixed(0)}% of total)`,
        recommendation: 'Reduce main meal portions or add healthy snacks'
      };
    }

    // Snacks should typically be 10-40% of total intake
    if (snackPercentage > 0.4) {
      return {
        isBalanced: false,
        issue: `Too many snacks (${(snackPercentage * 100).toFixed(0)}% of total)`,
        recommendation: 'Reduce snack portions and focus on main meals'
      };
    }

    return { isBalanced: true };
  }

  /**
   * ✅ NEW: Check consistency between different portion size formats
   */
  private static checkPortionConsistency(
    portionSizes: { [key: string]: number },
    requiredMainMeals: string[]
  ): { warnings: string[]; recommendations: string[]; penaltyPoints: number } {
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let penaltyPoints = 0;

    // Check for both capitalized and lowercase versions
    requiredMainMeals.forEach(meal => {
      const capitalizedPortion = portionSizes[meal];
      const lowercasePortion = portionSizes[meal.toLowerCase()];
      
      if (capitalizedPortion !== undefined && lowercasePortion !== undefined) {
        if (Math.abs(capitalizedPortion - lowercasePortion) > 0.01) {
          warnings.push(`Inconsistent portion sizes for ${meal}: ${capitalizedPortion} vs ${lowercasePortion}`);
          recommendations.push(`Use consistent naming for ${meal} portion sizes`);
          penaltyPoints += 2;
        }
      }
    });

    // Check for extreme variations between main meals
    const mainMealPortions = requiredMainMeals
      .map(meal => portionSizes[meal] ?? portionSizes[meal.toLowerCase()])
      .filter(p => p !== undefined);

    if (mainMealPortions.length >= 2) {
      const min = Math.min(...mainMealPortions);
      const max = Math.max(...mainMealPortions);
      const ratio = max / min;

      if (ratio > 3) {
        warnings.push(`Large variation in main meal sizes (${ratio.toFixed(1)}x difference)`);
        recommendations.push('Consider more balanced portion sizes across main meals');
        penaltyPoints += 3;
      }
    }

    return { warnings, recommendations, penaltyPoints };
  }

  /**
   * ✅ ENHANCED: Validate meal generation prerequisites
   */
  static validateMealGenerationPrerequisites(user: User, date: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    let score = 100;

    console.log('🔍 Validating meal generation prerequisites...');

    // Basic user validation
    const userValidation = this.validateUserProfile(user);
    if (!userValidation.isValid) {
      errors.push('User profile validation failed');
      errors.push(...userValidation.errors);
      score = Math.min(score, userValidation.score);
    }
    warnings.push(...userValidation.warnings);

    // Date validation
    if (!date) {
      errors.push('Date is required for meal generation');
      missingFields.push('date');
      score -= 20;
    } else {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        errors.push('Invalid date format');
        score -= 15;
      }
    }

    // ✅ CRITICAL REQUIREMENTS for meal generation
    if (!user.tdci?.adjustedTDCI) {
      errors.push('TDCI calculation required for calorie targeting');
      score -= 30;
    }

    if (!user.mealPreferences) {
      errors.push('Meal preferences required for meal structure');
      score -= 25;
    }

    // ✅ PORTION SIZES specific validation for meal generation
    if (!user.portionSizes) {
      warnings.push('No custom portion sizes - will use defaults');
      score -= 10;
    } else {
      const portionValidation = this.validatePortionSizes(user);
      if (!portionValidation.isValid) {
        errors.push('Portion sizes validation failed');
        score -= 15;
      }
    }

    const finalScore = Math.max(0, Math.min(100, score));
    const isValid = errors.length === 0;

    console.log('✅ Meal generation prerequisites validation:', {
      isValid,
      score: finalScore,
      canGenerate: isValid && finalScore >= 50
    });

    return {
      isValid,
      errors,
      warnings,
      missingFields,
      score: finalScore
    };
  }

  /**
   * ✅ FIXED: Generate portion sizes recommendations
   */
  static generatePortionSizesRecommendations(user: User): string[] {
    const recommendations: string[] = [];
    
    if (!user.portionSizes) {
      recommendations.push('Configure custom portion sizes for personalized meal planning');
      return recommendations;
    }

    const validation = this.validatePortionSizes(user);
    recommendations.push(...validation.recommendations);

    // ✅ FIXED: Use correct User interface properties
    // fitnessGoal.goal instead of goal, activityMultiplier instead of activityLevel
    const userGoal = user.fitnessGoal?.goal;
    const userActivityMultiplier = user.activityMultiplier;

    if (userGoal === 'Lose Fat' && validation.totalPortionWeight > 1.1) {
      recommendations.push('Consider reducing portion sizes to support fat loss goals');
    }

    if (userGoal === 'Build Muscle' && validation.totalPortionWeight < 0.9) {
      recommendations.push('Consider increasing portion sizes to support muscle building goals');
    }

    if (userActivityMultiplier && userActivityMultiplier > 1.8 && validation.totalPortionWeight < 1.0) {
      recommendations.push('Very active individuals may need larger portion sizes');
    }

    return recommendations;
  }

  /**
   * ✅ UTILITY: Quick validation check for critical meal generation fields
   */
  static hasMinimumRequirements(user: User): boolean {
    return !!(
      user &&
      user.id &&
      user.tdci?.adjustedTDCI &&
      user.mealPreferences
    );
  }

  /**
   * ✅ UTILITY: Get validation summary for UI display
   */
  static getValidationSummary(user: User): {
    status: 'excellent' | 'good' | 'needs_attention' | 'incomplete';
    score: number;
    criticalIssues: number;
    warnings: number;
    canGenerateMeals: boolean;
  } {
    const validation = this.validateUserProfile(user);
    
    let status: 'excellent' | 'good' | 'needs_attention' | 'incomplete';
    if (validation.score >= 90) status = 'excellent';
    else if (validation.score >= 75) status = 'good';
    else if (validation.score >= 50) status = 'needs_attention';
    else status = 'incomplete';

    return {
      status,
      score: validation.score,
      criticalIssues: validation.errors.length,
      warnings: validation.warnings.length,
      canGenerateMeals: validation.isValid && validation.score >= 60
    };
  }
}