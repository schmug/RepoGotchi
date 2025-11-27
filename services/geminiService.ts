import { GoogleGenAI, Type } from "@google/genai";
import { PetProfile, RepoStats, PetMood } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Analyze Repo Stats (Dynamic - Changes Daily)
export const analyzeRepoStats = async (repoName: string): Promise<RepoStats> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Analyze the public GitHub repository "${repoName}". 
    If it's a real repo, use your knowledge of it. If it seems made up, infer likely characteristics.
    
    1. **Repo Status**: Check if ARCHIVED. Look for best practices (CONTRIBUTING.md, CI/CD).
    2. **Code Quality**: Score based on complexity/maintenance.
    3. **Team Morale**: Score based on collaboration/velocity.
    4. **Top Contributors**: Identify 2-3 key personas.
    5. **Status Headline**: Generate a creative, descriptive 3-8 word phrase describing the pet's current condition based on these stats. 
       - NOT just "Happy" or "Sad". 
       - Examples: "Buried under linting errors", "Joyfully merging pull requests", "Collecting dust in the attic", "Refactoring legacy spaghetti", "Deploying to production".
    
    Return a JSON object matching the schema.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          openIssues: { type: Type.NUMBER },
          pullRequests: { type: Type.NUMBER },
          lastCommitDaysAgo: { type: Type.NUMBER },
          contributors: { type: Type.NUMBER },
          isArchived: { type: Type.BOOLEAN },
          bestPractices: { type: Type.ARRAY, items: { type: Type.STRING } },
          topContributors: { type: Type.ARRAY, items: { type: Type.STRING } },
          statusHeadline: { type: Type.STRING, description: "Descriptive status message" },
          codeQuality: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER },
                complexity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                testCoverage: { type: Type.NUMBER },
                lintingErrors: { type: Type.STRING, enum: ["Few", "Moderate", "Many"] },
                reason: { type: Type.STRING }
            },
            required: ["score", "complexity", "testCoverage", "lintingErrors", "reason"]
          },
          teamMorale: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER },
                mergeVelocity: { type: Type.STRING, enum: ["Slow", "Steady", "Fast"] },
                sentiment: { type: Type.STRING, enum: ["Negative", "Neutral", "Positive"] },
                collaboration: { type: Type.STRING, enum: ["Siloed", "Cooperative", "Synergistic"] },
                reason: { type: Type.STRING }
            },
            required: ["score", "mergeVelocity", "sentiment", "collaboration", "reason"]
          }
        },
        required: ["openIssues", "pullRequests", "lastCommitDaysAgo", "contributors", "isArchived", "bestPractices", "topContributors", "codeQuality", "teamMorale", "statusHeadline"]
      }
    }
  });

  if (!response.text) throw new Error("Failed to analyze repo stats");
  return JSON.parse(response.text);
};

// 2. Create Pet Profile (Stable - Persists for the Repo)
export const createPetProfile = async (repoName: string, stats: RepoStats): Promise<PetProfile> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    Create a unique "Repo Pet" persona for the repository "${repoName}".
    Context:
    - Primary Language/Stack: Inferred from repo name.
    - Complexity: ${stats.codeQuality.complexity}
    - Team Size: ${stats.contributors} contributors
    
    Guidelines:
    - Incorporate the vibe of the technology (e.g., Rust=Crab, React=Atom/Science, Python=Snake, Enterprise=Golem).
    - **Visual Prompt**: Create a description for a 3D avatar. **IMPORTANT**: Describe ONLY the physical appearance and character design (species, colors, accessories, texture). DO NOT describe the mood, pose, or background. We will apply mood dynamically later.
    
    Return a JSON object.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "A creative name for the pet" },
            species: { type: Type.STRING, description: "The species of the pet" },
            description: { type: Type.STRING, description: "A short lore description" },
            personality: { type: Type.STRING, description: "Personality traits" },
            visualPrompt: { type: Type.STRING, description: "Detailed 3D avatar prompt (Appearance ONLY)" }
        },
        required: ["name", "species", "description", "personality", "visualPrompt"]
      }
    }
  });

  if (!response.text) throw new Error("Failed to create pet profile");
  return JSON.parse(response.text);
};

// 3. Generate Pet Image (Uses Profile + Current State)
export const generatePetImage = async (visualPrompt: string): Promise<string> => {
  const model = "gemini-2.5-flash-image";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: visualPrompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image data found in response");
  } catch (e) {
    console.error("Image generation failed", e);
    return `https://picsum.photos/500/500?grayscale&blur=2`; 
  }
};

// Helper to construct dynamic prompt
export const getPetMoodDescription = (stats: any): string => {
    const isSick = stats.codeQualityScore < 50;
    const isSad = stats.moraleScore < 50;
    const isHappy = stats.moraleScore > 75;
    
    if (isSick && isSad) return "looking sick, glitchy, and depressed, huddled in a dark corner";
    if (isSick) return "looking feverish and glitchy with bugs surrounding it";
    if (isSad) return "looking sad, lonely, and crying";
    if (isHappy) return "looking energetic, glowing, and happy, celebrating a victory";
    return "looking calm and content";
};

// 4. Pet Reaction / Chat
export const getPetReaction = async (
  petName: string, 
  personality: string, 
  action: string, 
  currentStats: any
): Promise<string> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    You are ${petName}, a digital pet with the personality: ${personality}.
    Your current stats are: 
    - Health: ${currentStats.health}
    - Happiness (Morale): ${currentStats.happiness}
    - Code Quality: ${currentStats.codeQualityScore}
    - Team Morale: ${currentStats.moraleScore}
    
    The user just performed this action: "${action}".
    
    Respond with a short, 1-sentence reaction. Be in character. 
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || "...";
};