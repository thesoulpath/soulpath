import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import MLPipelineService from '@/lib/services/ml-pipeline-service';
import OpenRouterService from '@/lib/services/openrouter-service';
import * as path from 'path';

const openRouter = new OpenRouterService();
const mlPipeline = new MLPipelineService(prisma, openRouter);

export async function POST(request: NextRequest) {
  try {
    const { triggerSource = 'manual', minNewDataPoints = 10 } = await request.json();

    console.log(`🔄 Starting ML retraining pipeline - Source: ${triggerSource}`);

    // Step 1: Generate new training data
    console.log('📊 Generating training data...');
    const trainingData = await mlPipeline.generateTrainingData({
      minConfidence: 0.6,
      includeNegativeFeedback: true,
      includeFallbackCases: true,
      limit: 200
    });

    console.log(`✅ Generated ${trainingData.length} new training examples`);

    if (trainingData.length < minNewDataPoints) {
      return NextResponse.json({
        success: false,
        message: `Insufficient training data. Generated ${trainingData.length} examples, need at least ${minNewDataPoints}`,
        jobId: null
      });
    }

    // Step 2: Save training data to file (for Rasa training)
    const trainingDataFile = await saveTrainingDataToFile(trainingData);
    console.log(`💾 Saved training data to ${trainingDataFile}`);

    // Step 3: Train new Rasa model
    console.log('🤖 Training new Rasa model...');
    const modelVersion = await trainRasaModel();
    console.log(`✅ Trained new model: ${modelVersion}`);

    // Step 4: Evaluate model performance
    console.log('📈 Evaluating model performance...');
    const performance = await mlPipeline.evaluateModel(modelVersion);
    console.log(`📊 Model accuracy: ${performance.evaluationResults.accuracy.toFixed(3)}`);

    // Step 5: Mark feedback as reviewed
    const feedbackIds = await getUnreviewedFeedbackIds();
    if (feedbackIds.length > 0) {
      await mlPipeline.markFeedbackAsReviewed(feedbackIds);
      console.log(`✅ Marked ${feedbackIds.length} feedback items as reviewed`);
    }

    // Step 6: Create A/B test if performance is good
    let abTestId = null;
    if (performance.evaluationResults.accuracy > 0.8) {
      console.log('🧪 Creating A/B test for new model...');
      const abTest = await mlPipeline.createABTest({
        experimentName: `Model Comparison ${new Date().toISOString().split('T')[0]}`,
        modelAVersion: 'current_production',
        modelBVersion: modelVersion,
        trafficSplit: 0.1, // Start with 10% traffic
        successMetric: 'booking_completion_rate'
      });
      abTestId = abTest.id;
      console.log(`✅ Created A/B test: ${abTestId}`);
    }

    return NextResponse.json({
      success: true,
      message: 'ML retraining pipeline completed successfully',
      jobId: `retrain_${Date.now()}`,
      results: {
        trainingDataCount: trainingData.length,
        modelVersion,
        performance: {
          accuracy: performance.evaluationResults.accuracy,
          bookingSuccessRate: performance.bookingSuccessRate,
          avgConversationTurns: performance.avgConversationTurns
        },
        abTestId
      }
    });

  } catch (error) {
    console.error('❌ ML retraining pipeline error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'ML retraining pipeline failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function saveTrainingDataToFile(trainingData: any[]): Promise<string> {
  const fs = require('fs').promises;
  const path = require('path');
  
  const rasaDataDir = path.join(process.cwd(), 'rasa', 'data');
  const fileName = `training_data_${Date.now()}.yml`;
  const filePath = path.join(rasaDataDir, fileName);

  // Convert training data to Rasa NLU format
  const rasaFormat = convertToRasaFormat(trainingData);
  
  await fs.writeFile(filePath, rasaFormat, 'utf8');
  return filePath;
}

function convertToRasaFormat(trainingData: any[]): string {
  const intentGroups: Record<string, string[]> = {};
  
  for (const data of trainingData) {
    if (!intentGroups[data.intent]) {
      intentGroups[data.intent] = [];
    }
    
    let example = data.text;
    if (data.entities && data.entities.length > 0) {
      // Add entity annotations
      const sortedEntities = data.entities.sort((a: any, b: any) => b.start - a.start);
      for (const entity of sortedEntities) {
        const before = example.substring(0, entity.start);
        const after = example.substring(entity.end);
        example = `${before}[${entity.value}](${entity.entity})${after}`;
      }
    }
    
    intentGroups[data.intent].push(`    - ${example}`);
  }

  let yaml = 'version: "3.1"\n\nnlu:\n';
  
  for (const [intent, examples] of Object.entries(intentGroups)) {
    yaml += `- intent: ${intent}\n  examples: |\n`;
    yaml += examples.join('\n') + '\n\n';
  }
  
  return yaml;
}

async function trainRasaModel(): Promise<string> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  const rasaDir = path.join(process.cwd(), 'rasa');
  
  try {
    // Run rasa train command
    const { stdout, stderr } = await execAsync('rasa train', { cwd: rasaDir });
    
    if (stderr && !stderr.includes('WARNING')) {
      throw new Error(`Rasa training error: ${stderr}`);
    }
    
    // Extract model version from output
    const modelMatch = stdout.match(/model-(\d{8}-\d{6}-\w+)/);
    const modelVersion = modelMatch ? modelMatch[1] : `model_${Date.now()}`;
    
    return modelVersion;
  } catch (error) {
    console.error('Rasa training failed:', error);
    throw new Error(`Failed to train Rasa model: ${error}`);
  }
}

async function getUnreviewedFeedbackIds(): Promise<number[]> {
  const feedback = await prisma.userFeedback.findMany({
    where: { reviewedForTraining: false },
    select: { id: true },
    take: 100
  });
  
  return feedback.map(f => f.id);
}
