import { Types } from 'mongoose';
import groq from '../../config/groq';
import { Roadmap } from './roadmap_model';

const getMyRoadmap = async (learnerId: string) => {
  const roadmap = await Roadmap.findOne({
    learner: learnerId,
    status: 'active',
  }).sort({
    createdAt: -1,
  });
  if (!roadmap) {
    throw new Error('Roadmap not found.');
  }
  return roadmap;
};

const generateRoadmap = async (learnerId: string, goal: string) => {
  const existing = await Roadmap.findOne({
    learner: learnerId,
    status: 'active',
  });
  if (existing) {
    throw new Error('You already have a roadmap.');
  }

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
      "resources": [
        { "title": "Resource Name", "url": "https://example.com" }
      ],
      "order": 1
    }
  ]
}

Generate 6-8 steps. Each step should be clear, actionable and build on the previous one. Every resource must have both a title and a valid URL.`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to generate roadmap content.');
  }

  // Strip any accidental markdown fences
  const cleaned = content
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  let parsed: {
    title: string;
    description?: string;
    steps: {
      title: string;
      description?: string;
      resources?: { title: string; url: string }[];
      order: number;
    }[];
  };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }

  const roadmap = await Roadmap.create({
    learner: new Types.ObjectId(learnerId),
    title: parsed.title,
    description: parsed.description,
    goal,
    steps: parsed.steps.map((step) => ({
      title: step.title,
      description: step.description,
      // ensure each resource is a proper { title, url } object
      resources: Array.isArray(step.resources)
        ? step.resources.filter((r) => r.title && r.url)
        : [],
      order: step.order,
      status: 'not_started',
    })),
    isAIGenerated: true,
    status: 'active',
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
      resources?: { title: string; url: string }[];
      order: number;
    }[];
  },
) => {
  const existing = await Roadmap.findOne({
    learner: learnerId,
    status: 'active',
  });
  if (existing) {
    throw new Error('You already have a roadmap.');
  }

  const roadmap = await Roadmap.create({
    learner: new Types.ObjectId(learnerId),
    title: payload.title,
    description: payload.description,
    goal: payload.goal,
    steps: payload.steps.map((step) => ({
      title: step.title,
      description: step.description,
      resources: Array.isArray(step.resources)
        ? step.resources.filter((r) => r.title && r.url)
        : [],
      order: step.order,
      status: 'not_started',
    })),
    isAIGenerated: false,
    status: 'active',
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

  // Update step fields
  step.status = status;
  step.completedAt = status === 'completed' ? new Date() : undefined;

  // Recalculate top-level counters
  roadmap.completedSteps = roadmap.steps.filter(
    (s) => s.status === 'completed',
  ).length;

  // Flip roadmap-level status when all steps are done
  roadmap.status =
    roadmap.completedSteps === roadmap.totalSteps ? 'completed' : 'active';

  if (roadmap.status === 'completed' && !roadmap.completedAt) {
    roadmap.completedAt = new Date();
  }

  await roadmap.save();
  return roadmap;
};

const getCompletedRoadmaps = async (learnerId: string) => {
  const roadmaps = await Roadmap.find({
    learner: learnerId,
    status: 'completed',
  }).sort({
    completedAt: -1,
  });
  if (!roadmaps.length) {
    throw new Error('No roadmap found.');
  }
  return roadmaps;
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
  getCompletedRoadmaps,
  deleteRoadmap,
};
