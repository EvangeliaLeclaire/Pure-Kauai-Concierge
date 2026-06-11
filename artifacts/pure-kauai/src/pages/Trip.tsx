import { Fragment, useState } from "react";
import { useParams } from "wouter";
import { format, parseISO } from "date-fns";
import { Clock, Users, MapPin, Printer, Check, Link2 } from "lucide-react";
import { useGetItinerary, useApproveItinerary, getGetItineraryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Trip() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: itinerary, isLoading } = useGetItinerary(id, {
    query: {
      enabled: !!id,
      queryKey: getGetItineraryQueryKey(id),
    },
  });

  const approveItinerary = useApproveItinerary();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-12 max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <Skeleton className="h-6 w-96 rounded-lg" />
        <div className="space-y-4 mt-12">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-serif text-primary">Itinerary not found</h2>
          <p className="text-muted-foreground">The journey you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const handleApprove = () => {
    approveItinerary.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetItineraryQueryKey(id) });
        },
      }
    );
  };

  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalGuests = itinerary.adults + itinerary.children;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground print-hide py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518182170546-076616fdfaaf?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <h1 className="text-sm uppercase tracking-[0.2em] mb-4 text-accent">Pure Kauai Presents</h1>
          <h2 className="text-4xl md:text-5xl font-serif font-light mb-6">
            A Bespoke Journey for {itinerary.guestName}
          </h2>
          <div className="flex flex-wrap gap-4 text-sm opacity-90 items-center">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Kauai, Hawaii
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-accent"></div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {format(parseISO(itinerary.checkIn), "MMM d")} - {format(parseISO(itinerary.checkOut), "MMM d, yyyy")}
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-accent"></div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {totalGuests} Guests ({itinerary.adults} Adults{itinerary.children > 0 ? `, ${itinerary.children} Children` : ""})
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="print-hide mt-6 inline-flex items-center gap-2 text-sm border border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/20 text-white/90 hover:text-white rounded-full px-4 py-2 transition-all duration-200"
          >
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Link copied!" : "Copy shareable link"}
          </button>
        </div>
      </div>

      {/* Print Header (Only visible when printing) */}
      <div className="hidden print-show text-center mb-12 border-b pb-8">
        <h1 className="text-3xl font-serif text-primary mb-2">Pure Kauai Itinerary & Invoice</h1>
        <h2 className="text-2xl font-serif text-foreground mb-4">{itinerary.guestName}</h2>
        <p className="text-muted-foreground">
          {format(parseISO(itinerary.checkIn), "MMM d, yyyy")} — {format(parseISO(itinerary.checkOut), "MMM d, yyyy")} • {totalGuests} Guests
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <Tabs defaultValue="journey" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-12 print-hide bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="journey" className="font-serif rounded-md">Your Journey</TabsTrigger>
            <TabsTrigger value="invoice" className="font-serif rounded-md">Quote & Invoice</TabsTrigger>
          </TabsList>

          <TabsContent value="journey" className="space-y-16 animate-in fade-in duration-500 print-show">
            {itinerary.welcomeMessage && (
              <div className="prose prose-lg max-w-none text-muted-foreground bg-accent/30 p-8 rounded-xl border border-accent/50 italic font-serif">
                <p>"{itinerary.welcomeMessage}"</p>
                <p className="text-right not-italic text-sm mt-4 text-primary font-medium">— Your Pure Kauai Concierge</p>
              </div>
            )}

            <div className="space-y-16">
              {itinerary.days.map((day) => (
                <div key={day.day} className="relative">
                  <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-4 mb-6 border-b border-border/40">
                    <h3 className="text-2xl font-serif text-primary flex items-baseline gap-3">
                      Day {day.day}
                      <span className="text-sm font-sans text-muted-foreground font-normal tracking-wide uppercase">
                        {format(parseISO(day.date), "EEEE, MMMM d")}
                      </span>
                    </h3>
                  </div>
                  
                  <div className="space-y-8 pl-0 md:pl-8 border-l-0 md:border-l-2 border-accent/40 ml-0 md:ml-4">
                    {day.activities.map((activity, idx) => (
                      <div key={idx} className="relative">
                        <div className="hidden md:block absolute -left-[2.85rem] top-8 w-4 h-4 rounded-full bg-accent border-2 border-background"></div>
                        <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-shadow group bg-card">
                          <div className="grid md:grid-cols-5 gap-0">
                            <div className="md:col-span-2 h-48 md:h-auto relative overflow-hidden bg-muted">
                              {activity.photoUrl ? (
                                <img
                                  src={activity.photoUrl}
                                  alt={activity.name}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <div className="absolute top-4 left-4">
                                <Badge variant="secondary" className="bg-background/80 backdrop-blur-md text-foreground hover:bg-background/90 shadow-sm">
                                  {activity.time}
                                </Badge>
                              </div>
                            </div>
                            <div className="md:col-span-3 p-6 flex flex-col justify-center">
                              <h4 className="text-xl font-serif text-foreground mb-2">{activity.name}</h4>
                              <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                                {activity.description}
                              </p>
                              <div className="flex items-center text-sm text-primary/80 mt-auto font-medium">
                                <Clock className="h-4 w-4 mr-2" />
                                {activity.duration}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Call to action at bottom of journey tab */}
            <div className="mt-16 text-center print-hide border-t pt-12 border-border/50">
              <h3 className="text-2xl font-serif text-foreground mb-6">Ready to confirm your escape?</h3>
              <Button 
                onClick={() => document.querySelector<HTMLButtonElement>('[value="invoice"]')?.click()}
                variant="outline"
                className="h-12 px-8 font-serif text-lg"
              >
                View Quote & Approve
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="invoice" className="animate-in fade-in duration-500 print-show">
            <Card className="border-border/50 shadow-sm overflow-hidden bg-card">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-8 pt-8 px-8">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-serif text-primary mb-2">Quote & Invoice</CardTitle>
                    <CardDescription className="text-base">Prepared for {itinerary.guestName}</CardDescription>
                  </div>
                  {itinerary.approved && (
                    <Badge className="bg-green-600/10 text-green-700 hover:bg-green-600/20 border-green-600/20 px-4 py-1 text-sm font-medium">
                      <Check className="w-4 h-4 mr-2" /> Approved & Confirmed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                      <tr>
                        <th className="px-8 py-4 font-medium">Date & Activity</th>
                        <th className="px-8 py-4 font-medium text-right">Price per person</th>
                        <th className="px-8 py-4 font-medium text-right">Guests</th>
                        <th className="px-8 py-4 font-medium text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {itinerary.days.map((day) => (
                        <Fragment key={day.day}>
                          <tr className="bg-muted/10">
                            <td colSpan={4} className="px-8 py-3 font-serif text-primary/80 text-base">
                              {format(parseISO(day.date), "EEEE, MMM d")}
                            </td>
                          </tr>
                          {day.activities.map((activity, idx) => (
                            <tr key={idx} className="hover:bg-muted/10 transition-colors">
                              <td className="px-8 py-4">
                                <div className="font-medium text-foreground">{activity.name}</div>
                                <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                              </td>
                              <td className="px-8 py-4 text-right">${activity.pricePerPerson.toLocaleString()}</td>
                              <td className="px-8 py-4 text-right">{totalGuests}</td>
                              <td className="px-8 py-4 text-right font-medium text-foreground">
                                ${(activity.pricePerPerson * totalGuests).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-border/50 bg-muted/10">
                      {(() => {
                        const subtotal = itinerary.days.reduce((total, day) => {
                          const dayTotal = day.activities.reduce((sum, act) => sum + (act.pricePerPerson * totalGuests), 0);
                          return total + dayTotal;
                        }, 0);
                        const deposit = subtotal * 0.5;

                        return (
                          <>
                            <tr>
                              <td colSpan={3} className="px-8 py-4 text-right text-muted-foreground">Subtotal</td>
                              <td className="px-8 py-4 text-right font-medium text-foreground">${subtotal.toLocaleString()}</td>
                            </tr>
                            <tr className="bg-accent/20">
                              <td colSpan={3} className="px-8 py-4 text-right font-medium text-primary">50% Deposit Due to Confirm</td>
                              <td className="px-8 py-4 text-right font-bold text-primary text-lg">${deposit.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="px-8 py-4 text-right text-muted-foreground">Balance Due 30 Days Prior</td>
                              <td className="px-8 py-4 text-right font-medium text-muted-foreground">${deposit.toLocaleString()}</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center bg-muted/20 border-t border-border/50 p-8 print-hide">
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Print Invoice
                </Button>
                
                {!itinerary.approved ? (
                  <Button 
                    onClick={handleApprove} 
                    disabled={approveItinerary.isPending}
                    className="h-12 px-8 text-base font-serif"
                  >
                    {approveItinerary.isPending ? "Confirming..." : "Approve Itinerary"}
                  </Button>
                ) : (
                  <Button disabled variant="secondary" className="bg-green-600/10 text-green-700 opacity-100 font-serif h-12 px-8">
                    <Check className="w-4 h-4 mr-2" />
                    Itinerary Approved
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
