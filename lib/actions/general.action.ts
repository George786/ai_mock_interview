"use server";
import {db} from "@/firebase/admin";
import {generateObject} from "ai";
import {google} from "@ai-sdk/google";
import {feedbackSchema} from "@/constants";

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    const interviews = await db
        .collection("interviews")
        .where("userId", "==",userId)
        .orderBy("createdAt", "desc")
        .get()

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),

    })) as Interview[]
}

export async function getUserHistoryInterviews(userId: string): Promise<Interview[] | null> {
    // Interviews created by the user
    const createdSnapshot = await db
        .collection("interviews")
        .where("userId", "==", userId)
        .get();

    const created = createdSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];

    // Interviews taken by the user (based on feedbacks)
    const feedbackSnapshot = await db
        .collection("feedback")
        .where("userId", "==", userId)
        .get();

    const takenInterviewIds = Array.from(new Set(feedbackSnapshot.docs.map((d) => (d.data() as any).interviewId)));

    const takenDocs = await Promise.all(
        takenInterviewIds.map(async (id) => {
            const snap = await db.collection("interviews").doc(id).get();
            if (!snap.exists) return null;
            return { id: snap.id, ...snap.data() } as any;
        })
    );

    const combinedMap = new Map<string, any>();
    for (const item of [...created, ...takenDocs.filter(Boolean) as any[]]) {
        combinedMap.set(item.id, item);
    }

    const combined = Array.from(combinedMap.values()) as Interview[];

    combined.sort((a: any, b: any) => {
        const aDate = new Date(a.createdAt ?? 0).getTime();
        const bDate = new Date(b.createdAt ?? 0).getTime();
        return bDate - aDate;
    });

    return combined;
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    const snapshot = await db
        .collection("interviews")
        .where("finalized","==", true)
        .orderBy("createdAt", "desc")
        .limit(limit * 3) // fetch extra, we'll filter below
        .get();

    const items = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((doc: any) => doc.userId !== userId)
        .slice(0, limit) as Interview[];

    return items
}

export async function getInterviewsById(id: string): Promise<Interview | null> {
    const interviews = await db
        .collection("interviews")
        .doc(id)
        .get()

    return interviews.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams) {
    const {interviewId, userId, transcript} = params;

    try {
        const formattedTranscript = transcript
            .map((sentence: {role: string; content: string;}) => (
                `- ${sentence.role}: ${sentence.content}\n`
            )).join("");

        const {object: {totalScore, categoryScores, strengths, areasForImprovement, finalAssessment} } = await generateObject({
            model: google("gemini-2.0-flash-001"),
            schema: feedbackSchema,
            prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
            system:
                "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        const feedback = await db.collection("feedback").add({
            interviewId,
            userId,
            totalScore,
            categoryScores,
            strengths,
            areasForImprovement,
            finalAssessment,
            createdAt: new Date().toISOString()
        })

        return {
            success: true,
            feedbackId: feedback.id
        }
    } catch (e) {

        console.error("Error saving feedback", e)

        return {success: false}
    }
}



export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    const querySnapshot = await db
        .collection("feedback")
        .where("interviewId", "==", interviewId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (querySnapshot.empty) return null;

    const feedbackDoc = querySnapshot.docs[0];
    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}