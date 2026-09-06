import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";
import type { Tables } from "@/types/database.types";

export type ContactMessageRow = Tables<"contact_messages">;

export type ContactMessageInput = {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
};

function clean(value: string, max: number) {
  return value.trim().slice(0, max);
}

export async function submitContactMessage(input: ContactMessageInput): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Messages are temporarily unavailable. Please try again later.");

  const firstName = clean(input.firstName, 80);
  const lastName = clean(input.lastName, 80);
  const email = clean(input.email, 160);
  const subject = clean(input.subject, 160);
  const message = clean(input.message, 4000);

  if (!firstName || !lastName || !email || !subject || !message) {
    throw new Error("Please complete all contact fields.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const { error } = await client.from("contact_messages").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    subject,
    message,
  });

  if (error) {
    logSupabaseError("submitContactMessage", error);
    throw new Error("Your message could not be sent. Please try again.");
  }

  try {
    await client.functions.invoke("send-contact-email", {
      body: { firstName, lastName, email, subject, message },
    });
  } catch (invokeError) {
    logSupabaseError("send-contact-email", invokeError);
  }
}

export async function fetchContactMessages(): Promise<ContactMessageRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("contact_messages")
    .select("id, first_name, last_name, email, subject, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    logSupabaseError("fetchContactMessages", error);
    throw error;
  }

  return data ?? [];
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageRow["status"],
): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { error } = await client.from("contact_messages").update({ status }).eq("id", id);
  if (error) {
    logSupabaseError("updateContactMessageStatus", error);
    throw error;
  }
}
