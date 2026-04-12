import { Types } from 'mongoose';
import groq from '../../config/groq';
import { Roadmap } from './roadmap_model';

const getMyRoadmap = async (learnerId: string) => {
  const roadmap = await Roadmap.findOne({ learner: learnerId }).sort({
    createdAt: -1,
  });

  return roadmap;
};

const generateRoadmap = async (learnerId: string, goal: string) => {
  //check if roadmap already exists
  const existing = await Roadmap.findOne({ learner: learnerId });
  if (existing) {
    throw new Error(
      'You already have a roadmap. Delete it first to generate a new one.',
    );
  }

  //generate roadmap with Groq
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2000,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content:
          'You are a learning roadmap generator. You only respond with valid JSON, no markdown, no explanation, no code blocks.',
      },
      {
        role: 'user',
        content: `Generate a detailed learning roadmap for this goal: "${goal}".

Return ONLY a valid JSON object with this exact structure:
{
  "title": "roadmap title",
  "description": "brief description",
  "steps": [
    {
      "title": "step title",
      "description": "what to learn in this step",
      "resources": ["resource 1", "resource 2"],
      "order": 1
    }
  ]
}

Generate 6-8 steps. Each step should be clear, actionable and build on the previous one.`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to generate roadmap.');
  }

  //clean response — remove markdown if present
  const cleaned = content
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response.');
  }

  //save to MongoDB
  const roadmap = await Roadmap.create({
    learner: new Types.ObjectId(learnerId),
    title: parsed.title,
    description: parsed.description,
    goal,
    steps: parsed.steps.map((step: any) => ({
      ...step,
      status: 'not_started',
    })),
    isAIGenerated: true,
    totalSteps: parsed.steps.length,
    completedSteps: 0,
  });

  return roadmap;
};

const createRoadmap = async (
  learnerId: string,
  payload: {
    title: string;
    description?: string;
    goal: string;
    steps: {
      title: string;
      description?: string;
      resources?: string[];
      order: number;
    }[];
  },
) => {
  const existing = await Roadmap.findOne({ learner: learnerId });
  if (existing) {
    throw new Error(
      'You already have a roadmap. Delete it first to create a new one.',
    );
  }

  const roadmap = await Roadmap.create({
    learner: new Types.ObjectId(learnerId),
    title: payload.title,
    description: payload.description,
    goal: payload.goal,
    steps: payload.steps.map((step) => ({
      ...step,
      status: 'not_started',
    })),
    isAIGenerated: false,
    totalSteps: payload.steps.length,
    completedSteps: 0,
  });

  return roadmap;
};

const updateStepStatus = async (
  learnerId: string,
  roadmapId: string,
  stepId: string,
  status: 'not_started' | 'in_progress' | 'completed',
) => {
  const roadmap = await Roadmap.findOne({
    _id: roadmapId,
    learner: learnerId,
  });

  if (!roadmap) {
    throw new Error('Roadmap not found.');
  }

  const step = roadmap.steps.find((s) => s._id?.toString() === stepId);
  if (!step) {
    throw new Error('Step not found.');
  }

  //update step status
  step.status = status;

  //recalculate completedSteps
  roadmap.completedSteps = roadmap.steps.filter(
    (s) => s.status === 'completed',
  ).length;

  await roadmap.save();

  return roadmap;
};

const deleteRoadmap = async (learnerId: string, roadmapId: string) => {
  const roadmap = await Roadmap.findOneAndDelete({
    _id: roadmapId,
    learner: learnerId,
  });

  if (!roadmap) {
    throw new Error('Roadmap not found.');
  }

  return roadmap;
};

export const roadmapService = {
  getMyRoadmap,
  generateRoadmap,
  createRoadmap,
  updateStepStatus,
  deleteRoadmap,
};
