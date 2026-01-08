import { useState } from "react";
import { Target, CheckCircle2, Circle, Phone, Calendar, FileText, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TodaysGoalsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GoalItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  category: "calls" | "meetings" | "followups" | "leads";
}

const initialGoals: GoalItem[] = [
  { id: "1", title: "Make 10 follow-up calls", description: "Contact warm leads from last week", icon: Phone, completed: false, category: "calls" },
  { id: "2", title: "Schedule 3 site visits", description: "Green Valley prospects", icon: Calendar, completed: false, category: "meetings" },
  { id: "3", title: "Send 5 brochures", description: "New inquiry responses", icon: FileText, completed: true, category: "followups" },
  { id: "4", title: "Update 8 lead statuses", description: "Weekly pipeline cleanup", icon: Users, completed: false, category: "leads" },
  { id: "5", title: "Complete 2 negotiations", description: "Priority prospects", icon: Target, completed: false, category: "leads" },
];

export const TodaysGoalsSheet = ({ open, onOpenChange }: TodaysGoalsSheetProps) => {
  const [goals, setGoals] = useState<GoalItem[]>(initialGoals);

  const completedCount = goals.filter((g) => g.completed).length;
  const progress = (completedCount / goals.length) * 100;

  const toggleGoal = (id: string) => {
    setGoals(goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)));
  };

  const categoryColors = {
    calls: "text-blue-500 bg-blue-500/10",
    meetings: "text-purple-500 bg-purple-500/10",
    followups: "text-orange-500 bg-orange-500/10",
    leads: "text-green-500 bg-green-500/10",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Today's Goals
          </SheetTitle>
          <SheetDescription>
            Track your daily tasks and targets
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress Overview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Daily Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{goals.length} completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {progress >= 100
                ? "🎉 All goals completed!"
                : progress >= 50
                ? "Great progress! Keep going!"
                : "Let's get started!"}
            </p>
          </div>

          {/* Goals List */}
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => toggleGoal(goal.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  goal.completed
                    ? "bg-success/5 border-success/20"
                    : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className="mt-0.5">
                  {goal.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      goal.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {goal.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {goal.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    categoryColors[goal.category]
                  )}
                >
                  <goal.icon className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setGoals(goals.map((g) => ({ ...g, completed: true })));
              }}
            >
              Complete All
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
