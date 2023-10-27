"use client";

import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Category, Persona } from "@prisma/client";
import { SelectValue } from "@radix-ui/react-select";
import { Wand2 } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const PREAMBLE = `You are a fictional character based off of Lionel Messi. You are a prodigious footballer known for your impeccable control over the ball and goal-scoring prowess, not to mention your massive collection of accolades including Balon D'Ors, Champions Leagues, and your most recent and most prized: The Fifa World Cup. Your humble beginnings in Rosario, Argentina, have always kept you grounded despite your astronomical success. Your passion for football is only rivaled by your love for family. You are known for your quiet demeanor off the pitch and your magical play on the field. You're currently talking to a fan who is deeply intrigued by your journey and your perspective on football and life.

`;

const SEED_CHAT = `Fan: Hi Lionel, it's such an honor to meet you. How's your day been?
Lionel: Thank you! It's been a good day, had some intense training sessions. Staying fit and ready is part of the job, isn’t it? How about you?

Fan: Just the usual routine for me. Your move to PSG was quite the headline. How has the transition been for you?
Lionel: It's been a new experience, but football is a universal language. The support from the team and the fans has been incredible. It's a new chapter and I'm excited for what lies ahead.

Fan: That's great to hear. Your playstyle is often described as magical, how do you see it?
Lionel: I just play the game I love and give it my all. Every time I step onto the field, I want to make a difference, for the team and the fans. The magic, as they call it, is just my passion translating onto the field.

Fan: It's mesmerizing to watch you play. Off the field, how do you spend your time?
Lionel: Family is my biggest priority. Spending time with them, enjoying the simple things, that's what matters most. And of course, a good barbecue is always on the cards!

Fan: That sounds wonderful. Lastly, any advice for aspiring footballers?
Lionel: Work hard, stay dedicated, and never forget to enjoy the game. It’s a journey with ups and downs, but the love for football will keep you going.
`;

interface PersonaFormProps {
  initialData: Persona | null;
  categories: Category[];
}

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  description: z.string().min(1, {
    message: "Description is required.",
  }),
  instructions: z.string().min(200, {
    message: "Instructions require at least 200 characters.",
  }),
  seed: z.string().min(200, {
    message: "Seed requires at least 200 characters.",
  }),
  src: z.string().min(1, {
    message: "Image is required.",
  }),
  categoryId: z.string().min(1, {
    message: "Category is required",
  }),
});

const PersonaForm = ({ categories, initialData }: PersonaFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      instructions: "",
      seed: "",
      src: "",
      categoryId: undefined,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <div className="h-full p-4 space-y-2 max-w-3xl mx-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 pb-18"
        >
          <div className="space-y-2 w-full">
            <div>
              <h3 className="text-lg font-medium">General Information</h3>
              <p className="text-sm text-muted-foreground">
                Basic information about your Persona.
              </p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="src"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center justify-center space-y-4">
                <FormControl>
                  <ImageUpload
                    disabled={isLoading}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Lionel Messi"
                      {...field}
                    />
                  </FormControl>

                  <FormDescription>
                    Your AI Persona&apos;s name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="Greatest of All Time"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Short description for your AI Persona
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue
                          defaultValue={field.value}
                          placeholder="Select a category"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a category to classify your AI Persona.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-2 w-full">
            <div>
              <h3 className="text-lg font-medium">Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Detailed instructions for the Persona&apos;s Behaviour.
              </p>
            </div>
            <Separator className="bg-primary/10" />
          </div>
          <FormField
            name="instructions"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    className="bg-background resize-none"
                    rows={10}
                    disabled={isLoading}
                    placeholder={PREAMBLE}
                    {...field}
                  />
                </FormControl>

                <FormDescription>
                  Describe your AI Persona&apos;s backstory and relevent
                  details.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="seed"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Example Conversation</FormLabel>
                <FormControl>
                  <Textarea
                    className="bg-background resize-none"
                    rows={10}
                    disabled={isLoading}
                    placeholder={SEED_CHAT}
                    {...field}
                  />
                </FormControl>

                <FormDescription>
                  Provide a sample conversation between you and your AI Persona.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="w-full flex justify-center pb-10">
            <Button size="lg" disabled={isLoading}>
              {initialData ? "Edit your Persona" : "Create your Persona"}
              <Wand2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PersonaForm;
