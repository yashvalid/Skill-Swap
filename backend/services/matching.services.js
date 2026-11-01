/**
 * Semantic Interest & Affinity Matchmaking Service
 *
 * Implements multi-factor interest scoring between users based on:
 * 1. Conceptual Domain Knowledge Graph (Taxonomy clustering across technical & creative domains)
 * 2. Cross-domain complementary learning trajectories
 * 3. Bio & Role context semantic keyword extraction
 * 4. Verified standing & community trust momentum
 * 5. Explainable synergy insights ("Why you two should connect")
 */

// 1. Comprehensive Domain Knowledge Taxonomy
const DOMAIN_TAXONOMY = {
  software_cloud: {
    label: 'Software & Cloud Architecture',
    keywords: [
      'software', 'developer', 'engineer', 'backend', 'frontend', 'full stack', 'fullstack',
      'web', 'cloud', 'devops', 'kubernetes', 'docker', 'microservices', 'websocket', 'socket',
      'api', 'rest', 'graphql', 'node', 'nodejs', 'express', 'golang', 'go', 'rust', 'python',
      'typescript', 'javascript', 'distributed', 'redis', 'database', 'mongodb', 'postgresql',
      'sql', 'ci/cd', 'container', 'linux', 'system design', 'infrastructure', 'server'
    ]
  },
  frontend_ui: {
    label: 'Frontend & Modern Web',
    keywords: [
      'frontend', 'react', 'reactjs', 'nextjs', 'next.js', 'vue', 'angular', 'svelte',
      'tailwind', 'css', 'html', 'javascript', 'typescript', 'responsive', 'web development',
      'components', 'client', 'spa', 'browser', 'dom'
    ]
  },
  design_creative: {
    label: 'UI/UX & Visual Design Systems',
    keywords: [
      'design', 'ui', 'ux', 'ui/ux', 'figma', 'design systems', 'tokens', 'typography',
      'spacing', 'micro-interactions', 'prototyping', 'wireframing', 'user research',
      'visual design', 'branding', 'accessibility', 'a11y', 'product design', 'creative direction',
      'blender', '3d', 'motion', 'animation', 'after effects', 'vector', 'illustration'
    ]
  },
  mobile_engineering: {
    label: 'Mobile Engineering (iOS & Android)',
    keywords: [
      'mobile', 'flutter', 'dart', 'swift', 'swiftui', 'ios', 'android', 'kotlin',
      'react native', 'cross-platform', 'app store', 'mobile performance', 'state management'
    ]
  },
  audio_sound: {
    label: 'Audio Production & Sound Engineering',
    keywords: [
      'audio', 'sound', 'music', 'sound design', 'mixing', 'mastering', 'ableton', 'ableton live',
      'synth', 'synthesizer', 'modular', 'modular synth', 'production', 'foley', 'acoustics',
      'compression', 'eq', 'game audio', 'soundtrack', 'recording', 'dsp', 'spatial audio'
    ]
  },
  languages_culture: {
    label: 'Languages & Cultural Exchange',
    keywords: [
      'language', 'linguist', 'polyglot', 'japanese', 'french', 'spanish', 'german', 'mandarin',
      'chinese', 'italian', 'korean', 'english', 'translation', 'interpretation', 'jlpt',
      'pronunciation', 'conversational', 'accent', 'cultural', 'etiquette', 'grammar'
    ]
  },
  ai_data: {
    label: 'AI, Machine Learning & Data Automation',
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'data science',
      'data', 'analytics', 'python', 'automation', 'nlp', 'llm', 'genai', 'gemini', 'embeddings',
      'pytorch', 'tensorflow', 'scikit', 'prompt', 'prompt engineering', 'data visualization'
    ]
  },
  product_writing: {
    label: 'Product Strategy & Technical Writing',
    keywords: [
      'product', 'product management', 'strategy', 'writing', 'technical writing', 'copywriting',
      'content', 'storytelling', 'pitch', 'pitching', 'public speaking', 'positioning', 'marketing',
      'indie hacker', 'growth', 'seo', 'documentation', 'communication'
    ]
  }
};

/**
 * Normalizes text string into lower-case alphanumeric tokens.
 */
const tokenizeText = (text) => {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
};

/**
 * Extracts domain affinity weights for a user profile based on role, bio, and skills.
 */
const extractUserDomainVector = (user) => {
  if (!user) return {};

  const profileTokens = [
    ...tokenizeText(user.role),
    ...tokenizeText(user.bio),
    ...(user.skillsOffered || []).flatMap(s => tokenizeText(s)),
    ...(user.skillsNeeded || []).flatMap(s => tokenizeText(s))
  ];

  const domainScores = {};

  for (const [domainKey, domain] of Object.entries(DOMAIN_TAXONOMY)) {
    let matchCount = 0;
    for (const kw of domain.keywords) {
      if (kw.includes(' ')) {
        const combined = (user.role + ' ' + user.bio + ' ' + (user.skillsOffered || []).join(' ')).toLowerCase();
        if (combined.includes(kw)) matchCount += 2;
      } else {
        if (profileTokens.includes(kw)) matchCount += 1;
      }
    }
    if (matchCount > 0) {
      domainScores[domainKey] = matchCount;
    }
  }

  return domainScores;
};

/**
 * Calculates domain similarity (cosine-like overlap) between two domain score vectors.
 */
const calculateDomainOverlap = (vectorA, vectorB) => {
  const keysA = Object.keys(vectorA);
  const keysB = Object.keys(vectorB);
  if (!keysA.length || !keysB.length) return 0;

  let sharedWeight = 0;
  let totalWeight = 0;

  const allKeys = new Set([...keysA, ...keysB]);
  allKeys.forEach(k => {
    const valA = vectorA[k] || 0;
    const valB = vectorB[k] || 0;
    if (valA > 0 && valB > 0) {
      sharedWeight += Math.min(valA, valB) * 2;
    }
    totalWeight += Math.max(valA, valB);
  });

  if (totalWeight === 0) return 0;
  return Math.min(100, Math.round((sharedWeight / totalWeight) * 100));
};

/**
 * Evaluates complementary exchange trajectory:
 * Does user A offer skills in domains that user B wants to learn, and vice versa?
 */
const calculateComplementaryScore = (userA, userB) => {
  if (!userA || !userB) return 0;

  const aOffers = (userA.skillsOffered || []).flatMap(s => tokenizeText(s));
  const aNeeds = (userA.skillsNeeded || []).flatMap(s => tokenizeText(s));
  const bOffers = (userB.skillsOffered || []).flatMap(s => tokenizeText(s));
  const bNeeds = (userB.skillsNeeded || []).flatMap(s => tokenizeText(s));

  const aTeachesBDirect = aOffers.filter(token => bNeeds.some(n => n.includes(token) || token.includes(n))).length;
  const bTeachesADirect = bOffers.filter(token => aNeeds.some(n => n.includes(token) || token.includes(n))).length;

  const aOfferVec = extractUserDomainVector({ role: '', bio: '', skillsOffered: userA.skillsOffered, skillsNeeded: [] });
  const bNeedVec = extractUserDomainVector({ role: '', bio: '', skillsOffered: [], skillsNeeded: userB.skillsNeeded });
  const bOfferVec = extractUserDomainVector({ role: '', bio: '', skillsOffered: userB.skillsOffered, skillsNeeded: [] });
  const aNeedVec = extractUserDomainVector({ role: '', bio: '', skillsOffered: [], skillsNeeded: userA.skillsNeeded });

  const aToBDomainSynergy = Object.keys(aOfferVec).some(k => bNeedVec[k] > 0);
  const bToADomainSynergy = Object.keys(bOfferVec).some(k => aNeedVec[k] > 0);

  let score = 40;

  if (aTeachesBDirect > 0) score += 20;
  else if (aToBDomainSynergy) score += 15;

  if (bTeachesADirect > 0) score += 20;
  else if (bToADomainSynergy) score += 15;

  return Math.min(98, score);
};

/**
 * Calculates bio and role contextual keyword similarity (TF-IDF style).
 */
const calculateBioContextSimilarity = (userA, userB) => {
  const bioA = tokenizeText((userA.role || '') + ' ' + (userA.bio || ''));
  const bioB = tokenizeText((userB.role || '') + ' ' + (userB.bio || ''));

  if (!bioA.length || !bioB.length) return 40;

  const setB = new Set(bioB);
  const intersection = bioA.filter(token => setB.has(token));

  const meaningfulMatches = intersection.filter(t => !['and', 'the', 'for', 'with', 'from', 'about', 'just', 'that'].includes(t));

  const matchRatio = meaningfulMatches.length / Math.sqrt(bioA.length * bioB.length);
  const score = Math.round(Math.min(95, 30 + matchRatio * 150));
  return score;
};

/**
 * Calculates trust & momentum score based on verified badge and active ratings.
 */
const calculateTrustScore = (user) => {
  let score = 50;
  if (user.isVerified) score += 25;
  if (user.totalRatings > 0) {
    score += Math.min(20, user.totalRatings * 4);
    if (user.averageRating >= 4.8) score += 5;
  }
  return Math.min(100, score);
};

// Cross-domain adjacency map (disciplines that naturally collaborate)
const ADJACENT_DOMAINS = {
  software_cloud: ['frontend_ui', 'mobile_engineering', 'ai_data'],
  frontend_ui: ['software_cloud', 'design_creative', 'mobile_engineering'],
  design_creative: ['frontend_ui', 'product_writing', 'audio_sound'],
  mobile_engineering: ['frontend_ui', 'software_cloud'],
  audio_sound: ['design_creative', 'frontend_ui'],
  languages_culture: ['product_writing'],
  ai_data: ['software_cloud', 'product_writing'],
  product_writing: ['design_creative', 'ai_data', 'languages_culture']
};

/**
 * Synthesizes human-friendly "Why You Two Should Connect" explanation and synergy tags.
 */
const generateSynergyInsights = (userA, userB, scoreBreakdown) => {
  const vectorA = scoreBreakdown.vectorA || {};
  const vectorB = scoreBreakdown.vectorB || {};

  const sharedDomains = Object.keys(vectorA)
    .filter(k => vectorB[k] > 0)
    .map(k => DOMAIN_TAXONOMY[k]?.label)
    .filter(Boolean);

  const synergyTags = [];

  if (scoreBreakdown.finalScore >= 85) {
    synergyTags.push('High Reciprocal Fit');
  } else if (scoreBreakdown.finalScore >= 65) {
    synergyTags.push('Domain Synergy');
  } else {
    synergyTags.push('Community Peer');
  }

  if (sharedDomains.length > 0) {
    synergyTags.push(sharedDomains[0].split(' ')[0] + ' Overlap');
  } else if (scoreBreakdown.complementaryScore >= 20) {
    synergyTags.push('Skill Exchange');
  }

  if (userB.isVerified) {
    synergyTags.push('Verified Mentor');
  }

  let whyConnect = '';
  if (scoreBreakdown.candTeachesCurDirect > 0 && scoreBreakdown.curTeachesCandDirect > 0) {
    whyConnect = `Perfect two-way match: Direct skill alignment between what you teach and what you want to learn.`;
  } else if (sharedDomains.length >= 2) {
    whyConnect = `Strong dual affinity in ${sharedDomains[0]} and ${sharedDomains[1]} with high mutual growth potential.`;
  } else if (sharedDomains.length === 1) {
    whyConnect = `Shared passion in ${sharedDomains[0]} with high collaborative potential.`;
  } else if (scoreBreakdown.complementaryScore >= 20) {
    const bTopSkill = userB.skillsOffered?.[0] || userB.role;
    whyConnect = `Great learning opportunity in ${bTopSkill} with active community standing.`;
  } else {
    whyConnect = `Community peer in ${userB.role || 'modern disciplines'}.`;
  }

  const bFirstname = userB.fullname?.firstname || 'there';
  const icebreaker = `Hi ${bFirstname}! I noticed your focus on ${userB.skillsOffered?.[0] || userB.role || 'SkillSwap'}. I'd love to explore exchanging thoughts and projects together!`;

  return {
    sharedDomains,
    synergyTags: synergyTags.slice(0, 3),
    whyConnect,
    icebreaker
  };
};

/**
 * Calculates total affinity match between two users.
 */
const calculatePairAffinity = (currentUser, candidateUser) => {
  if (!currentUser || !candidateUser) {
    return {
      matchScore: 25,
      sharedDomains: [],
      synergyTags: ['Community Peer'],
      whyConnect: 'Explore collaborative learning and skill exchange.',
      icebreaker: 'Hi there! Excited to connect and learn together on SkillSwap.'
    };
  }

  // 1. Extract tokens
  const curOffers = (currentUser.skillsOffered?.length ? currentUser.skillsOffered : (currentUser.role ? [currentUser.role] : []))
    .flatMap(s => tokenizeText(s));
  const curNeeds = (currentUser.skillsNeeded || []).flatMap(s => tokenizeText(s));

  const candOffers = (candidateUser.skillsOffered?.length ? candidateUser.skillsOffered : (candidateUser.role ? [candidateUser.role] : []))
    .flatMap(s => tokenizeText(s));
  const candNeeds = (candidateUser.skillsNeeded || []).flatMap(s => tokenizeText(s));

  // 2. Domain vectors for offerings and needs
  const curOfferVec = extractUserDomainVector({
    role: currentUser.role || '',
    bio: currentUser.bio || '',
    skillsOffered: currentUser.skillsOffered?.length ? currentUser.skillsOffered : (currentUser.role ? [currentUser.role] : []),
    skillsNeeded: []
  });

  const curNeedVec = extractUserDomainVector({
    role: '',
    bio: '',
    skillsOffered: [],
    skillsNeeded: currentUser.skillsNeeded || []
  });

  const candOfferVec = extractUserDomainVector({
    role: candidateUser.role || '',
    bio: candidateUser.bio || '',
    skillsOffered: candidateUser.skillsOffered?.length ? candidateUser.skillsOffered : (candidateUser.role ? [candidateUser.role] : []),
    skillsNeeded: []
  });

  const candNeedVec = extractUserDomainVector({
    role: '',
    bio: '',
    skillsOffered: [],
    skillsNeeded: candidateUser.skillsNeeded || []
  });

  // Base foundation score (15 points base for any registered member)
  let score = 15;

  // A. Complementary Trajectory (Up to 40 pts)
  const candTeachesCurDirect = candOffers.filter(t => curNeeds.some(n => n.includes(t) || t.includes(n))).length;
  const curTeachesCandDirect = curOffers.filter(t => candNeeds.some(n => n.includes(t) || t.includes(n))).length;

  const candTeachesCurDomain = Object.keys(candOfferVec).some(k => curNeedVec[k] > 0);
  const curTeachesCandDomain = Object.keys(curOfferVec).some(k => candNeedVec[k] > 0);

  let complementaryScore = 0;
  if (candTeachesCurDirect > 0) complementaryScore += 20;
  else if (candTeachesCurDomain) complementaryScore += 12;

  if (curTeachesCandDirect > 0) complementaryScore += 20;
  else if (curTeachesCandDomain) complementaryScore += 12;

  // If one user hasn't specified needs, reward adjacent domain collaboration fit
  if (!curNeeds.length || !candNeeds.length) {
    const curDomains = Object.keys(curOfferVec);
    const candDomains = Object.keys(candOfferVec);
    const isAdjacent = curDomains.some(cd => (ADJACENT_DOMAINS[cd] || []).some(ad => candDomains.includes(ad)));
    if (isAdjacent && complementaryScore < 15) {
      complementaryScore += 12;
    }
  }

  score += complementaryScore;

  // B. Domain Kinship (Up to 25 pts)
  const sharedDomains = Object.keys(curOfferVec).filter(d => candOfferVec[d] > 0);
  if (sharedDomains.length >= 2) {
    score += 25;
  } else if (sharedDomains.length === 1) {
    score += 16;
  } else {
    // Check adjacent domain kinship
    const curDomains = Object.keys(curOfferVec);
    const candDomains = Object.keys(candOfferVec);
    const hasAdjacency = curDomains.some(cd => (ADJACENT_DOMAINS[cd] || []).some(ad => candDomains.includes(ad)));
    if (hasAdjacency) score += 8;
  }

  // C. Bio & Context Keyword Overlap (Up to 10 pts)
  const bioA = tokenizeText(currentUser.bio || '');
  const bioB = tokenizeText(candidateUser.bio || '');
  const stopWords = new Set(['and', 'the', 'for', 'with', 'about', 'from', 'that', 'this', 'have', 'been']);
  const bioHits = bioA.filter(t => !stopWords.has(t) && bioB.includes(t)).length;
  score += Math.min(10, bioHits * 2.5);

  // D. Trust & Reputation Bonus (Up to 10 pts)
  if (candidateUser.isVerified) score += 5;
  if (candidateUser.totalRatings > 0) {
    score += Math.min(5, candidateUser.totalRatings * 1.5);
  }

  // Final Calibration: realistic range between 15% and 98%
  const finalScore = Math.min(98, Math.max(15, Math.round(score)));

  const scoreBreakdown = {
    vectorA: curOfferVec,
    vectorB: candOfferVec,
    complementaryScore,
    candTeachesCurDirect,
    curTeachesCandDirect,
    finalScore
  };

  const insights = generateSynergyInsights(currentUser, candidateUser, scoreBreakdown);

  return {
    matchScore: finalScore,
    ...insights,
    breakdown: {
      base: 15,
      complementaryScore,
      sharedDomainCount: sharedDomains.length,
      bioHits,
      verified: candidateUser.isVerified
    }
  };
};

/**
 * Ranks all available peers for a given user by semantic interest affinity.
 */
const rankRecommendedPeers = (currentUser, allUsers, options = {}) => {
  if (!Array.isArray(allUsers)) return [];

  const candidatePool = allUsers.filter(u => {
    if (!u || !u._id) return false;
    if (currentUser && u._id.toString() === currentUser._id.toString()) return false;
    return true;
  });

  const scoredPeers = candidatePool.map(candidate => {
    const affinity = calculatePairAffinity(currentUser, candidate);
    return {
      user: candidate,
      affinity
    };
  });

  scoredPeers.sort((a, b) => b.affinity.matchScore - a.affinity.matchScore);

  const limit = options.limit || 25;
  return scoredPeers.slice(0, limit);
};

/**
 * Finds peers matching a natural language interest query (e.g. "building audio web apps with python").
 */
const matchByInterestQuery = (query, allUsers, currentUser) => {
  if (!query || typeof query !== 'string') return [];

  const queryTokens = tokenizeText(query);
  if (!queryTokens.length) return [];

  // Identify domain of the query
  const queryDomainVec = extractUserDomainVector({
    role: query,
    bio: query,
    skillsOffered: [query],
    skillsNeeded: []
  });
  const targetDomains = Object.keys(queryDomainVec);

  const candidatePool = (allUsers || []).filter(u => {
    if (!u || !u._id) return false;
    if (currentUser && u._id.toString() === currentUser._id.toString()) return false;
    return true;
  });

  const scored = candidatePool.map(user => {
    const offeredTokens = (user.skillsOffered || []).flatMap(s => tokenizeText(s));
    const roleTokens = tokenizeText(user.role || '');
    const bioTokens = tokenizeText(user.bio || '');

    // 1. Direct skills offered hits (Highest priority: candidate actively teaches this)
    const directSkillHits = (user.skillsOffered || []).filter(s => {
      const sLower = s.toLowerCase();
      return queryTokens.some(qt => sLower.includes(qt));
    });

    const directTokenMatches = queryTokens.filter(qt => offeredTokens.some(ot => ot.includes(qt) || qt.includes(ot))).length;

    // 2. Role relevance
    const roleMatches = queryTokens.filter(qt => roleTokens.some(rt => rt.includes(qt) || qt.includes(rt))).length;

    // 3. Domain relevance (based on what they offer)
    const userOfferVec = extractUserDomainVector({
      role: user.role || '',
      bio: '',
      skillsOffered: user.skillsOffered || [],
      skillsNeeded: []
    });
    const sharesDomain = targetDomains.some(td => userOfferVec[td] > 0);

    // 4. Bio hits
    const bioMatches = queryTokens.filter(qt => bioTokens.includes(qt)).length;

    let score = 20;

    // Skills offered are primary criterion
    if (directSkillHits.length > 0) {
      score += 45 + Math.min(15, directTokenMatches * 5);
    } else if (roleMatches > 0) {
      score += 35 + Math.min(10, roleMatches * 5);
    } else if (sharesDomain) {
      score += 25;
    } else if (bioMatches > 0) {
      score += 15;
    }

    if (user.isVerified) score += 5;
    if (user.totalRatings > 0) score += Math.min(5, user.totalRatings * 1.5);

    const finalScore = Math.min(99, Math.max(15, Math.round(score)));

    // Generate accurate whyConnect message
    let whyConnect = '';
    if (directSkillHits.length > 0) {
      whyConnect = `Teaches ${directSkillHits.join(', ')} with verified expertise in ${user.role || 'this domain'}.`;
    } else if (roleMatches > 0) {
      whyConnect = `Active ${user.role} with direct background in ${query}.`;
    } else if (sharesDomain) {
      const domainLabel = DOMAIN_TAXONOMY[targetDomains[0]]?.label || user.role;
      whyConnect = `Experienced mentor in ${domainLabel} related to "${query}".`;
    } else {
      whyConnect = `Community peer exploring topics adjacent to "${query}".`;
    }

    const synergyTags = [];
    if (directSkillHits.length > 0) synergyTags.push('Direct Skill Match');
    if (sharesDomain) synergyTags.push('Domain Expert');
    if (user.isVerified) synergyTags.push('Verified Mentor');
    if (!synergyTags.length) synergyTags.push('Community Peer');

    return {
      user,
      affinity: {
        matchScore: finalScore,
        whyConnect,
        synergyTags: synergyTags.slice(0, 3),
        sharedDomains: targetDomains.map(d => DOMAIN_TAXONOMY[d]?.label).filter(Boolean),
        icebreaker: `Hi ${user.fullname?.firstname || 'there'}! I saw you offer expertise in ${directSkillHits[0] || user.skillsOffered?.[0] || user.role}. I'd love to connect!`
      }
    };
  });

  scored.sort((a, b) => b.affinity.matchScore - a.affinity.matchScore);
  return scored.slice(0, 20);
};

module.exports = {
  DOMAIN_TAXONOMY,
  tokenizeText,
  extractUserDomainVector,
  calculatePairAffinity,
  rankRecommendedPeers,
  matchByInterestQuery
};
