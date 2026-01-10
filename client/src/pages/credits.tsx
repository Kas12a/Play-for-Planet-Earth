import { useStore, CreditTransaction } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Gift, Heart, Zap } from "lucide-react";
import { format } from "date-fns";

const getTransactionIcon = (type: CreditTransaction['type']) => {
  switch (type) {
    case 'EARN': return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'REDEEM': return <Gift className="w-4 h-4 text-blue-500" />;
    case 'DONATE': return <Heart className="w-4 h-4 text-pink-500" />;
    case 'SPONSOR_TOPUP': return <Zap className="w-4 h-4 text-yellow-500" />;
    case 'REVERSAL': return <TrendingDown className="w-4 h-4 text-orange-500" />;
    default: return <Coins className="w-4 h-4" />;
  }
};

const getTransactionColor = (type: CreditTransaction['type']) => {
  switch (type) {
    case 'EARN': return 'text-green-500';
    case 'SPONSOR_TOPUP': return 'text-yellow-500';
    case 'REDEEM': return 'text-blue-500';
    case 'DONATE': return 'text-pink-500';
    default: return 'text-muted-foreground';
  }
};

export default function CreditsPage() {
  const { user, transactions } = useStore();

  if (!user) return null;

  const earnedThisWeek = transactions
    .filter(t => t.type === 'EARN' && new Date(t.createdAt) > new Date(Date.now() - 7 * 86400000))
    .reduce((sum, t) => sum + t.amount, 0);

  const spentThisWeek = transactions
    .filter(t => (t.type === 'REDEEM' || t.type === 'DONATE') && new Date(t.createdAt) > new Date(Date.now() - 7 * 86400000))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Credits</h1>
        <p className="text-muted-foreground">Track your eco-credits and transaction history.</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-card border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardContent className="pt-8 pb-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Available Balance</p>
              <div className="flex items-baseline gap-2">
                <Coins className="w-8 h-8 text-primary" />
                <span className="text-5xl font-bold font-mono tracking-tight">{user.credits}</span>
                <span className="text-xl text-muted-foreground">credits</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-green-500">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">Earned this week</span>
                </div>
                <p className="text-2xl font-bold font-mono">+{earnedThisWeek}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-blue-500">
                  <ArrowDownRight className="w-4 h-4" />
                  <span className="text-sm font-medium">Spent this week</span>
                </div>
                <p className="text-2xl font-bold font-mono">-{spentThisWeek}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your last 20 credit transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground">Start logging actions to earn credits!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 20).map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-background">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {tx.metadata?.actionTitle || tx.metadata?.itemTitle || tx.metadata?.projectTitle || tx.sourceType.replace(/_/g, ' ')}
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {tx.type}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt), 'MMM d, yyyy • h:mm a')}
                        {tx.confidence && (
                          <span className="ml-2">• Confidence: {Math.round(tx.confidence * 100)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold font-mono text-lg ${getTransactionColor(tx.type)}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">How Credits Work</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Earn</strong> credits by logging eco-actions and completing quests</li>
                <li>• <strong>Redeem</strong> credits for rewards in the marketplace</li>
                <li>• <strong>Donate</strong> credits to support environmental projects</li>
                <li>• Credits are calculated based on action impact and verification confidence</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
