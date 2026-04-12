import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { topic, description } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json([
        {
          title: `Fundamentals of ${topic}`,
          estimatedHours: 2,
          completed: false,
          resources: [{ label: "Intro Video", url: `https://www.youtube.com/results?search_query=intro+to+${topic}` }],
          subtasks: [{ title: "Basic concepts", completed: false }, { title: "Terminologies", completed: false }]
        },
      ]);
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a professional study architect. Create a detailed learning roadmap. 
          Respond ONLY with a JSON object containing a "tasks" array. 
          Each task must have:
          - title (string)
          - estimatedHours (number)
          - subtasks (array of objects with {title: string})
          - resources (array of objects with {label: string, url: string})
          CRITICAL: Use ONLY search engine result URLs to avoid 404s. 
          For videos, use: https://www.youtube.com/results?search_query=[TOPIC]
          For docs, use: https://www.google.com/search?q=[TOPIC]+documentation`
        },
        {
          role: "user",
          content: `Topic: ${topic}\nDescription: ${description}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message?.content || '{"tasks": []}';
    let taskData = JSON.parse(content);
    if (taskData.tasks) taskData = taskData.tasks;
    if (!Array.isArray(taskData)) taskData = [];

    const tasks = taskData.map((task: any) => ({
      title: task.title || "Untitled Milestone",
      estimatedHours: Number(task.estimatedHours) || 1,
      completed: false,
      subtasks: (Array.isArray(task.subtasks) ? task.subtasks : []).map((s: any) => ({
        title: typeof s === "string" ? s : (s.title || "Untitled Task"),
        completed: false
      })),
      resources: (Array.isArray(task.resources) ? task.resources : []).map((r: any) => ({
        label: r.label || "Resource",
        url: r.url || "#"
      }))
    }));

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Groq Generation Error:", error);
    return NextResponse.json({ message: "Failed to generate plan" }, { status: 500 });
  }
}
