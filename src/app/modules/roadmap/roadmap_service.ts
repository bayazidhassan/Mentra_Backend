import { Roadmap } from './roadmap_model';

const getMyRoadmap = async (learnerId: string) => {
  const roadmap = await Roadmap.findOne({ learner: learnerId }).sort({
    createdAt: -1,
  });

  return roadmap;
};

export const roadmapService = {
  getMyRoadmap,
};
