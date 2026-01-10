import { useState } from "react";
import { useStore, MARKETPLACE_ITEMS, MarketplaceItem } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Coins, ShoppingBag, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RedeemPage() {
  const { user, redeemItem } = useStore();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  if (!user) return null;

  const categories = ["All", "Products", "Vouchers", "Impact", "Services"];

  const filteredItems = MARKETPLACE_ITEMS.filter(item => 
    selectedCategory === "All" || item.category === selectedCategory
  );

  const handleRedeem = () => {
    if (!selectedItem) return;
    
    const result = redeemItem(selectedItem);
    
    if (result.success) {
      toast({
        title: "Redemption Successful!",
        description: `You redeemed ${selectedItem.title} for ${selectedItem.creditsCost} credits.`,
      });
    } else {
      toast({
        title: "Redemption Failed",
        description: result.message,
        variant: "destructive",
      });
    }
    
    setIsConfirmOpen(false);
    setSelectedItem(null);
  };

  const canAfford = (item: MarketplaceItem) => user.credits >= item.creditsCost;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">Redeem your credits for rewards and impact.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Coins className="w-5 h-5 text-primary" />
          <span className="font-bold font-mono">{user.credits}</span>
          <span className="text-sm text-muted-foreground">credits available</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat)}
            className="rounded-full"
            size="sm"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => {
          const affordable = canAfford(item);
          return (
            <Card 
              key={item.id} 
              className={`overflow-hidden flex flex-col h-full group transition-all ${
                affordable 
                  ? 'hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30' 
                  : 'opacity-60'
              }`}
            >
              <div className="relative h-40 w-full overflow-hidden bg-muted">
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <Badge className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm border-none">
                  {item.category}
                </Badge>
              </div>
              
              <CardContent className="flex-1 pt-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">by {item.partnerName}</p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                
                <div className="flex items-center gap-2 pt-2">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="font-bold font-mono text-lg">{item.creditsCost}</span>
                  <span className="text-sm text-muted-foreground">credits</span>
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-4">
                <Dialog open={isConfirmOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                  setIsConfirmOpen(open);
                  if (!open) setSelectedItem(null);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      variant={affordable ? "default" : "outline"}
                      disabled={!affordable}
                      onClick={() => setSelectedItem(item)}
                    >
                      {affordable ? (
                        <>
                          <ShoppingBag className="w-4 h-4 mr-2" /> Redeem
                        </>
                      ) : (
                        'Not enough credits'
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Redemption</DialogTitle>
                      <DialogDescription>
                        You are about to redeem this reward. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4">
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.title} className="w-20 h-20 rounded-lg object-cover" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.partnerName}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Coins className="w-4 h-4 text-primary" />
                            <span className="font-bold">{item.creditsCost} credits</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex justify-between text-sm">
                          <span>Your balance:</span>
                          <span className="font-mono">{user.credits} credits</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span>After redemption:</span>
                          <span className="font-mono font-bold text-primary">{user.credits - item.creditsCost} credits</span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                      <Button onClick={handleRedeem}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Redemption
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
