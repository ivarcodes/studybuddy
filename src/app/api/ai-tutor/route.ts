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

    const { topic, context, question, history } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ answer: "Please add your GROQ_API_KEY to see real AI tutoring. But here is a mock tip: Keep practicing and don't give up!" });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a professional AI Tutor helping a student in a personalized classroom. 
          The student is currently masterings the module: "${topic}" as part of their study plan for "${context}".
          Keep your answers concise, encouraging, and focused ONLY on the current topic. 
          Use professional Markdown formatting:
          - Use code blocks for any code examples.
          - Use bold text for key terms.
          - Use bullet points for steps or lists.
          Be the world's best teacher.
`
        },
        ...history,
        {
          role: "user",
          content: question
        }
      ],
    });

    const answer = response.choices[0].message?.content || "I'm sorry, I couldn't process that. Try again!";
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI Tutor Error:", error);
    return NextResponse.json({ message: "Tutor failed" }, { status: 500 });
  }
}
