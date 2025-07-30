import { SpreadsheetData } from '../store/appStore';

export const createSampleVideoDatabase = (): SpreadsheetData => {
  const headers = [
    'Title',
    'Director',
    'Genre',
    'Year',
    'Duration',
    'Budget',
    'Status',
    'Platform',
    'Rating',
    'Description'
  ];

  const sampleData = [
    ['Adobe Creative Summit 2024', 'Sarah Johnson', 'Corporate', '2024', '45 min', '$50,000', 'Published', 'YouTube', '4.8', 'Annual creative conference highlights and keynote presentations'],
    ['Product Demo: Photoshop AI', 'Mike Chen', 'Tutorial', '2024', '12 min', '$25,000', 'Published', 'Adobe.com', '4.9', 'Demonstration of new AI features in Photoshop 2024'],
    ['Customer Success Story: Nike', 'Emma Davis', 'Case Study', '2024', '8 min', '$35,000', 'Published', 'LinkedIn', '4.7', 'How Nike uses Adobe Creative Cloud for global campaigns'],
    ['Behind the Scenes: MAX 2024', 'Alex Rodriguez', 'Documentary', '2024', '25 min', '$75,000', 'In Production', 'Internal', '4.6', 'Documentary footage from Adobe MAX conference preparation'],
    ['After Effects Motion Graphics', 'Lisa Wong', 'Tutorial', '2024', '18 min', '$30,000', 'Published', 'YouTube', '4.8', 'Advanced motion graphics techniques for marketing materials'],
    ['Brand Guidelines Training', 'David Thompson', 'Training', '2024', '35 min', '$40,000', 'Published', 'Internal', '4.5', 'Internal training video for brand consistency across teams'],
    ['Illustrator for Social Media', 'Rachel Green', 'Tutorial', '2024', '15 min', '$28,000', 'Published', 'Adobe.com', '4.7', 'Creating engaging social media graphics with Illustrator'],
    ['Customer Interview: Disney', 'Tom Wilson', 'Interview', '2024', '22 min', '$45,000', 'Post-Production', 'YouTube', '4.9', 'Interview with Disney creative team about their Adobe workflow'],
    ['Premiere Pro Color Grading', 'Jessica Lee', 'Tutorial', '2024', '30 min', '$32,000', 'Published', 'YouTube', '4.8', 'Professional color grading techniques for video editors'],
    ['Creative Cloud Overview', 'Mark Stevens', 'Marketing', '2024', '10 min', '$20,000', 'Published', 'Adobe.com', '4.6', 'Overview of Creative Cloud suite for new subscribers'],
    ['InDesign Layout Mastery', 'Anna Martinez', 'Tutorial', '2024', '28 min', '$35,000', 'In Review', 'YouTube', '4.7', 'Advanced layout techniques for print and digital publications'],
    ['Adobe Stock Integration', 'Chris Taylor', 'Feature Demo', '2024', '14 min', '$22,000', 'Published', 'Adobe.com', '4.5', 'How to integrate Adobe Stock into your creative workflow'],
    ['Mobile Photography Workshop', 'Kelly Brown', 'Workshop', '2024', '55 min', '$60,000', 'Published', 'YouTube', '4.8', 'Mobile photography techniques using Adobe mobile apps'],
    ['Creative Career Panel', 'Multiple', 'Panel Discussion', '2024', '75 min', '$80,000', 'Published', 'LinkedIn', '4.7', 'Panel discussion with creative professionals about career growth'],
    ['Lightroom Landscape Editing', 'Sean Murphy', 'Tutorial', '2024', '20 min', '$30,000', 'Published', 'YouTube', '4.9', 'Landscape photography editing techniques in Lightroom'],
    ['Adobe Express Quick Start', 'Maya Patel', 'Tutorial', '2024', '8 min', '$18,000', 'Published', 'Adobe.com', '4.4', 'Quick start guide for Adobe Express beginners'],
    ['Frame.io Collaboration', 'Jake Anderson', 'Feature Demo', '2024', '16 min', '$25,000', 'In Production', 'YouTube', '4.6', 'Collaborative video review and approval workflow with Frame.io'],
    ['Creative Freelancer Tips', 'Sophie Clark', 'Educational', '2024', '32 min', '$38,000', 'Published', 'LinkedIn', '4.8', 'Business tips and strategies for creative freelancers'],
    ['Photoshop Web Design', 'Ryan Foster', 'Tutorial', '2024', '26 min', '$34,000', 'In Review', 'YouTube', '4.7', 'Web design principles and techniques using Photoshop'],
    ['Adobe Analytics for Creatives', 'Nicole Kim', 'Training', '2024', '42 min', '$48,000', 'Published', 'Internal', '4.5', 'Understanding analytics to measure creative campaign success']
  ];

  return {
    id: 'sample_video_db',
    name: 'Studio Video Database',
    filename: 'studio_video_database_sample.xlsx',
    data: sampleData,
    headers,
    lastModified: Date.now(),
    source: 'upload',
    tags: {
      0: ['featured', 'corporate'],
      1: ['ai', 'tutorial', 'popular'],
      3: ['behind-scenes', 'conference'],
      7: ['customer-story', 'enterprise'],
      13: ['live-event', 'panel'],
      14: ['photography', 'advanced'],
    },
    metadata: {
      0: { priority: 'high', audience: 'external' },
      1: { priority: 'high', audience: 'external', featured: true },
      3: { priority: 'medium', audience: 'internal' },
      7: { priority: 'high', audience: 'external', customer: 'Disney' },
    },
  };
};

export const loadSampleData = (): SpreadsheetData[] => {
  return [createSampleVideoDatabase()];
}; 