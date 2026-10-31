const { GoogleGenAI } = require('@google/genai');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Fallback curriculum generator if API key is not configured or network fails.
 */
const getFallbackCurriculum = (skillA, skillB) => {
    return {
        title: `4-Week Exchange: ${skillA} & ${skillB}`,
        summary: `A structured 4-week reciprocal learning roadmap balancing practical practice between ${skillA} and ${skillB}.`,
        recommendedSessionCadence: '2 sessions per week (45 mins per skill)',
        weeks: [
            {
                week: 1,
                focus: 'Fundamentals & Setup',
                learnTopic: `Core concepts, syntax, tools, and dev environment for ${skillA}.`,
                teachTopic: `Assessing partner baseline, walk through setup, and core foundations of ${skillB}.`,
                milestoneExercise: `Build a "Hello World" or starter playground combining both basic setups.`
            },
            {
                week: 2,
                focus: 'Core Building Blocks & Patterns',
                learnTopic: `Hands-on practice with common workflows and primary design/code patterns in ${skillA}.`,
                teachTopic: `Review partner's progress and guide them through building block exercises in ${skillB}.`,
                milestoneExercise: `Complete a mini-component or isolated mini-task in both domains.`
            },
            {
                week: 3,
                focus: 'Real-World Application & Problem Solving',
                learnTopic: `Deep dive into advanced tips, common pitfalls, and debugging/refining in ${skillA}.`,
                teachTopic: `Pair live to troubleshoot a real-world task or feature in ${skillB}.`,
                milestoneExercise: `Collaboratively build a small combined project incorporating elements of both skills.`
            },
            {
                week: 4,
                focus: 'Synthesis, Review & Next Steps',
                learnTopic: `Code/design review, best practices showcase, and self-study resources for ${skillA}.`,
                teachTopic: `Evaluate partner's capstone, answer open questions, and endorse verified skills in ${skillB}.`,
                milestoneExercise: `Present final work to each other and leave mutual reviews on Skill-Swap.`
            }
        ],
        isFallback: true
    };
};

/**
 * Stage 1: Generate a personalized reciprocal 4-week curriculum.
 */
module.exports.generateCurriculum = async ({ skillToLearn, skillToTeach, partnerName }) => {
    const client = getGeminiClient();

    if (!client) {
        console.warn('[AI Service] GEMINI_API_KEY not found in env. Serving structured fallback curriculum.');
        return getFallbackCurriculum(skillToLearn, skillToTeach);
    }

    const prompt = `
You are an expert instructional designer and mentor for a peer skill-swapping platform called "Skill Swap".
Two users agreed to exchange skills:
- The current user wants to LEARN: "${skillToLearn}"
- The current user will TEACH: "${skillToTeach}"
${partnerName ? `- Their partner's name is: "${partnerName}"` : ''}

Create a pragmatic, well-paced 4-week mutual curriculum where both users learn from each other in balanced reciprocal sessions.

Return ONLY a valid JSON object matching this schema:
{
  "title": "Short title describing the exchange",
  "summary": "1-2 sentence overview of the exchange plan",
  "recommendedSessionCadence": "e.g. 2 sessions per week (45-60 min each)",
  "weeks": [
    {
      "week": 1,
      "focus": "Week theme",
      "learnTopic": "Specific concepts the user learns in ${skillToLearn}",
      "teachTopic": "Specific concepts the user teaches in ${skillToTeach}",
      "milestoneExercise": "Concrete practical mini-task to complete together"
    },
    { "week": 2, ... },
    { "week": 3, ... },
    { "week": 4, ... }
  ]
}
`;

    try {
        const response = await client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text?.trim();
        if (!text) throw new Error('Empty response from AI model');

        const parsed = JSON.parse(text);
        parsed.isFallback = false;
        return parsed;
    } catch (err) {
        console.error('[AI Service] Failed to call Gemini API for curriculum:', err.message);
        return getFallbackCurriculum(skillToLearn, skillToTeach);
    }
};

/**
 * Stage 2A: Enhance a Swap Request Pitch.
 */
module.exports.enhancePitch = async ({ offersSkill, requestsSkill, partnerName, customGoal }) => {
    const client = getGeminiClient();

    const fallbackPitch = `Hi ${partnerName || 'there'}! I'd love to exchange skills with you. I can offer hands-on guidance with ${offersSkill || 'my skills'} in exchange for learning ${requestsSkill || 'your expertise'}. We can structure casual, high-value practice sessions to hit our goals efficiently!`;

    if (!client) {
        return {
            pitch: fallbackPitch,
            hook: `Mutual learning in ${offersSkill} & ${requestsSkill}`,
            isFallback: true
        };
    }

    const prompt = `
You are helping a Skill Swap platform user write a friendly, high-conversion skill swap proposal.
Sender offers to teach: "${offersSkill}"
Sender wants to learn: "${requestsSkill}"
Partner name: "${partnerName || 'Friend'}"
${customGoal ? `Goal context: "${customGoal}"` : ''}

Write a polite, engaging 2-3 sentence proposal message emphasizing mutual value.
Return ONLY a valid JSON object:
{
  "pitch": "The proposal message",
  "hook": "A short 4-7 word punchy headline hook"
}
`;

    try {
        const response = await client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text?.trim();
        if (!text) throw new Error('Empty response from AI model');
        const parsed = JSON.parse(text);
        parsed.isFallback = false;
        return parsed;
    } catch (err) {
        console.error('[AI Service] Failed to call Gemini API for pitch:', err.message);
        return {
            pitch: fallbackPitch,
            hook: `Mutual learning in ${offersSkill} & ${requestsSkill}`,
            isFallback: true
        };
    }
};

/**
 * Stage 2B: Extract profile skills & bio from unstructured text.
 */
module.exports.extractProfileSkills = async ({ rawText }) => {
    const client = getGeminiClient();

    const fallbackBio = rawText?.slice(0, 150) || 'Passionate developer and learner eager to share skills and grow together.';
    const fallback = {
        suggestedBio: fallbackBio,
        suggestedRole: 'Full Stack Enthusiast',
        skillsOffered: ['JavaScript', 'Web Development'],
        skillsNeeded: ['UI/UX Design', 'System Architecture'],
        isFallback: true
    };

    if (!client) {
        return fallback;
    }

    const prompt = `
Extract skills and craft a polished bio from the following user self-description / resume snippet:
"${rawText}"

Identify:
1. Skills they have and can offer/teach.
2. Skills they might want to learn or complement their profile with.
3. A crisp 2-sentence bio.
4. An appropriate professional role title (e.g. "Full Stack Developer", "UI Designer", etc.).

Return ONLY a valid JSON object:
{
  "suggestedBio": "A crisp, engaging 2-sentence bio",
  "suggestedRole": "Professional role title",
  "skillsOffered": ["Skill1", "Skill2", "Skill3"],
  "skillsNeeded": ["SkillA", "SkillB"]
}
`;

    try {
        const response = await client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text?.trim();
        if (!text) throw new Error('Empty response from AI model');
        const parsed = JSON.parse(text);
        parsed.isFallback = false;
        return parsed;
    } catch (err) {
        console.error('[AI Service] Failed to call Gemini API for skill extraction:', err.message);
        return fallback;
    }
};

/**
 * Stage 3: Semantic Matchmaking & Compatibility Scoring.
 */
module.exports.calculateCompatibility = async ({ currentUser, candidateUser }) => {
    const userOffers = (currentUser.skillsOffered || []).map(s => s.toLowerCase());
    const userNeeds = (currentUser.skillsNeeded || []).map(s => s.toLowerCase());
    const candOffers = (candidateUser.skillsOffered || []).map(s => s.toLowerCase());
    const candNeeds = (candidateUser.skillsNeeded || []).map(s => s.toLowerCase());

    const userOffersWhatCandNeeds = userOffers.filter(s => candNeeds.some(cn => cn.includes(s) || s.includes(cn)));
    const candOffersWhatUserNeeds = candOffers.filter(s => userNeeds.some(un => un.includes(s) || s.includes(un)));

    let score = 50;
    if (userOffersWhatCandNeeds.length > 0) score += 25;
    if (candOffersWhatUserNeeds.length > 0) score += 20;

    score = Math.min(score, 98);

    const client = getGeminiClient();
    if (!client) {
        return {
            score,
            reason: userOffersWhatCandNeeds.length > 0 || candOffersWhatUserNeeds.length > 0
                ? `Complementary match: Great overlap between your skills and ${candidateUser.fullname?.firstname}'s learning goals.`
                : `Potential match in ${candidateUser.role || 'related domain'}.`,
            synergyTags: ['Collaborative', 'High Value']
        };
    }

    const prompt = `
Analyze peer skill-swapping compatibility between two users:
User A offers: [${userOffers.join(', ')}], needs: [${userNeeds.join(', ')}]
User B offers: [${candOffers.join(', ')}], needs: [${candNeeds.join(', ')}]

Return ONLY a valid JSON object:
{
  "score": number between 40 and 99,
  "reason": "One engaging, concise sentence explaining why they are a great swap match",
  "synergyTags": ["Tag1", "Tag2"]
}
`;

    try {
        const response = await client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text?.trim();
        if (!text) throw new Error('Empty response');
        return JSON.parse(text);
    } catch (err) {
        return {
            score,
            reason: `Great mutual growth opportunities in ${candidateUser.role || 'technical skills'}.`,
            synergyTags: ['Skill Swap', 'Growth']
        };
    }
};

/**
 * Stage 5: In-Chat AI Tutor & Learning Companion (SkillBot).
 */
module.exports.askTutor = async ({ message, history = [], learningSkills = [] }) => {
    const client = getGeminiClient();

    if (!client) {
        return {
            reply: `Hello! I'm SkillBot, your AI learning companion. To enable full dynamic live answers, configure your GEMINI_API_KEY. In the meantime, remember to break down your swap goals into 30-minute practice blocks! What skill are you practicing today?`,
            isFallback: true
        };
    }

    const contextSkills = learningSkills.length ? `The user is focused on learning: ${learningSkills.join(', ')}.` : '';

    const prompt = `
You are SkillBot, a friendly, encouraging, and highly practical AI tutor embedded inside "Skill Swap".
${contextSkills}
The user is learning peer-to-peer. Keep answers concise, clear, and action-oriented. Provide quick code examples or practice challenges when asked.

Conversation history:
${history.map(h => `${h.role === 'user' ? 'User' : 'SkillBot'}: ${h.text}`).join('\n')}

User: "${message}"
SkillBot:
`;

    try {
        const response = await client.models.generateContent({
            model: MODEL_NAME,
            contents: prompt
        });

        const reply = response.text?.trim() || "I'm here to help you learn and practice your skills! What would you like to explore next?";
        return { reply, isFallback: false };
    } catch (err) {
        console.error('[AI Service] Failed to call Gemini API for SkillBot:', err.message);
        return {
            reply: "I had a temporary connection hiccup, but I'm ready to keep learning with you! What topic would you like to review?",
            isFallback: true
        };
    }
};
