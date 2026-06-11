"use client";

import * as React from "react";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SAMPLE_PROMPTS = [
  "iPhone 16 Pro üçün premium Instagram postu hazırla",
  "Tap.az üçün daha satıcı başlıq variantları ver",
  "PS5 üçün 5 hashtag dəsti yarat",
  "Dyson tozsoran üçün rus dilində elan yaz",
];

export function AiChat() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const viewport = listRef.current?.closest('[data-slot="scroll-area-viewport"]');
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok) throw new Error(`Server xətası: ${res.status}`);
      const data = (await res.json()) as { reply?: string };
      const reply =
        typeof data.reply === "string" && data.reply.trim()
          ? data.reply
          : "Üzr istəyirəm, cavab hazırlana bilmədi. Yenidən cəhd edin.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      toast.error("Cavab alına bilmədi. Yenidən cəhd edin.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Üzr istəyirəm, bağlantı xətası baş verdi. Zəhmət olmasa yenidən cəhd edin.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSamplePrompt(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  return (
    <Card className="flex h-[600px] flex-col gap-0 overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Sparkles className="size-4" />
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-900">AI Assistent</div>
          <div className="text-xs text-zinc-500">Satış kontenti üzrə köməkçiniz</div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div ref={listRef} className="flex flex-col gap-4 p-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Bot className="size-6" />
              </div>
              <h3 className="text-sm font-medium text-zinc-900">AI assistentlə söhbətə başlayın</h3>
              <p className="mt-1 max-w-sm text-sm text-zinc-500">
                Məhsullarınız üçün elan mətni, başlıq, hashtag və daha çoxunu hazırlamağımı istəyin.
              </p>
              <div className="mt-5 flex w-full max-w-md flex-col gap-2">
                {SAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSamplePrompt(prompt)}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={cn("flex items-start gap-2.5", message.role === "user" && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  message.role === "user" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
                )}
              >
                {message.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap",
                  message.role === "user"
                    ? "rounded-tr-sm bg-indigo-600 text-white"
                    : "rounded-tl-sm border border-zinc-200 bg-white text-zinc-800 shadow-xs"
                )}
              >
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Bot className="size-3.5" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-500 shadow-xs">
                <Loader2 className="size-3.5 animate-spin" />
                Düşünür...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-zinc-100 p-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mesajınızı yazın... (məsələn: PS5 üçün Instagram postu hazırla)"
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()} aria-label="Göndər">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Göndər
          </Button>
        </form>
      </div>
    </Card>
  );
}
