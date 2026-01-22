import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, Users, DollarSign, Lock, Mail, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Help Center - Football Squares",
  description: "Get help with Football Squares",
};

const faqs = [
  {
    question: "How do I create a game?",
    answer: "Click 'Create Your Game' from the homepage or dashboard. Fill in your game details including team names, game date, and payout structure. Pay the $5 game fee to activate your game.",
  },
  {
    question: "How do players join my game?",
    answer: "After creating your game, you'll get a unique share link. Send this link to your friends and family. They can sign up and pick their squares through that link.",
  },
  {
    question: "How do I confirm payments?",
    answer: "When a player reserves squares, they appear as 'pending' in your manager dashboard. Once you receive payment (Venmo, cash, etc.), click 'Confirm' to lock in their squares.",
  },
  {
    question: "What happens to unpaid squares?",
    answer: "Squares that aren't confirmed within the reservation period (default 24 hours) are automatically released back to the pool for other players to claim.",
  },
  {
    question: "How are the numbers generated?",
    answer: "When you lock your grid, the numbers 0-9 are randomly assigned to each row and column. This happens automatically when you click 'Lock Grid & Generate Numbers'.",
  },
  {
    question: "Can I change the payout structure?",
    answer: "Yes, you can customize the payout percentages for each quarter when creating your game. The total must equal 100%.",
  },
];

export default function HelpPage() {
  return (
    <div className="container py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Help Center</h1>
        <p className="text-muted-foreground">
          Everything you need to know about using Football Squares
        </p>
      </div>

      {/* Quick Start Guide */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
          <CardDescription>Get your game up and running in 3 simple steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold mb-2">Create Your Game</h3>
              <p className="text-sm text-muted-foreground">
                Set up team names, date, and payout structure
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold mb-2">Share the Link</h3>
              <p className="text-sm text-muted-foreground">
                Invite players using your unique game link
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold mb-2">Lock & Play</h3>
              <p className="text-sm text-muted-foreground">
                Lock the grid to generate numbers and watch the game
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Still Need Help?
          </CardTitle>
          <CardDescription>
            Can&apos;t find what you&apos;re looking for?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
