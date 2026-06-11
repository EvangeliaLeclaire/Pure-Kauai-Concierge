import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { useCreateItinerary } from "@workspace/api-client-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const interestsOptions = [
  "Beach & Water",
  "Adventure & Hiking",
  "Culture & History",
  "Wellness & Spa",
  "Dining & Food",
  "Family Activities",
];

const formSchema = z.object({
  hostName: z.string().min(2, "Your name is required"),
  hostEmail: z.string().email("A valid email is required"),
  hostPhone: z.string().min(7, "A phone number is required"),
  guestName: z.string().min(2, "Guest name is required"),
  checkIn: z.date({ required_error: "Check-in date is required" }),
  checkOut: z.date({ required_error: "Check-out date is required" }),
  adults: z.coerce.number().min(1, "At least 1 adult required"),
  children: z.coerce.number().min(0),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  budgetTier: z.enum(["Premium", "Ultra-Luxury"]),
  specialOccasion: z.enum(["None", "Anniversary", "Honeymoon", "Birthday", "Family Reunion"]),
  specialNotes: z.string().optional(),
});

export default function Home() {
  const [, setLocation] = useLocation();
  const createItinerary = useCreateItinerary();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hostName: "",
      hostEmail: "",
      hostPhone: "",
      guestName: "",
      adults: 2,
      children: 0,
      interests: [],
      budgetTier: "Premium",
      specialOccasion: "None",
      specialNotes: "",
    },
  });

  const isGenerating = createItinerary.isPending;

  function onSubmit(values: z.infer<typeof formSchema>) {
    createItinerary.mutate(
      {
        data: {
          hostName: values.hostName,
          hostEmail: values.hostEmail,
          hostPhone: values.hostPhone,
          guestName: values.guestName,
          checkIn: format(values.checkIn, "yyyy-MM-dd"),
          checkOut: format(values.checkOut, "yyyy-MM-dd"),
          adults: values.adults,
          children: values.children,
          interests: values.interests,
          // @ts-ignore
          budgetTier: values.budgetTier,
          // @ts-ignore
          specialOccasion: values.specialOccasion,
          specialNotes: values.specialNotes || null,
        },
      },
      {
        onSuccess: (data) => {
          setLocation(`/trip/${data.id}`);
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-serif text-primary mb-3">Pure Kauai</h1>
          <p className="text-lg text-muted-foreground font-serif italic">Concierge Itinerary Generator</p>
        </div>

        <Card className="border-0 shadow-xl bg-card">
          {isGenerating ? (
            <div className="py-24 px-8 text-center flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center relative z-10 animate-bounce">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-2xl font-serif text-primary">Crafting the Extraordinary...</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our AI concierge is assembling a bespoke journey tailored perfectly to your guest's desires. This takes a moment.
              </p>
            </div>
          ) : (
            <>
              <CardHeader className="border-b border-border/50 pb-6 px-8 pt-8">
                <CardTitle className="text-2xl font-serif text-foreground">Guest Profile</CardTitle>
                <CardDescription>Enter details to generate a personalized Kauai experience.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 px-8 pb-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* ── Host Details ─────────────────────────────────── */}
                    <div className="space-y-4">
                      <div className="pb-1">
                        <p className="text-base font-serif text-foreground">Your Details</p>
                        <p className="text-sm text-muted-foreground mt-0.5">Displayed on the guest itinerary so they can reach you directly.</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="hostName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Malia Fonoti" className="bg-transparent" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="hostEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">Your Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="you@purekauai.com" className="bg-transparent" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hostPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">Your Phone</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+1 808 000 0000" className="bg-transparent" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* ── Guest Profile ─────────────────────────────────── */}
                    <div className="space-y-6 pt-6 border-t border-border/50">
                      <div className="pb-1">
                        <p className="text-base font-serif text-foreground">Guest Profile</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="guestName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">Guest Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. The Harrison Family" className="bg-transparent" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="checkIn"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-foreground/80 font-medium">Arrival Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal bg-transparent",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="checkOut"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-foreground/80 font-medium">Departure Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal bg-transparent",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="adults"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">Adults</FormLabel>
                              <FormControl>
                                <Input type="number" min={1} className="bg-transparent" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="children"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80 font-medium">Children</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} className="bg-transparent" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-border/50">
                      <FormField
                        control={form.control}
                        name="interests"
                        render={() => (
                          <FormItem>
                            <div className="mb-4">
                              <FormLabel className="text-base font-serif text-foreground">Guest Interests</FormLabel>
                              <FormDescription>Select all that apply to guide the itinerary AI.</FormDescription>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {interestsOptions.map((item) => (
                                <FormField
                                  key={item}
                                  control={form.control}
                                  name="interests"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={item}
                                        className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/40 p-4 hover:bg-muted/30 transition-colors"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, item])
                                                : field.onChange(
                                                    field.value?.filter(
                                                      (value) => value !== item
                                                    )
                                                  )
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer w-full">
                                          {item}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-6 pt-6 border-t border-border/50">
                      <FormField
                        control={form.control}
                        name="budgetTier"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-base font-serif text-foreground">Experience Tier</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="Premium" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    Premium (Luxury accommodations & elevated experiences)
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="Ultra-Luxury" />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    Ultra-Luxury (Private chefs, helicopter charters, exclusive access)
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specialOccasion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">Special Occasion</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-transparent">
                                  <SelectValue placeholder="Select an occasion" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Anniversary">Anniversary</SelectItem>
                                <SelectItem value="Honeymoon">Honeymoon</SelectItem>
                                <SelectItem value="Birthday">Birthday</SelectItem>
                                <SelectItem value="Family Reunion">Family Reunion</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specialNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80 font-medium">Concierge Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Any dietary restrictions, accessibility needs, or specific requests..."
                                className="resize-none min-h-[100px] bg-transparent"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg font-serif tracking-wide" disabled={isGenerating}>
                      {isGenerating ? "Crafting Itinerary..." : "Generate Itinerary"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
