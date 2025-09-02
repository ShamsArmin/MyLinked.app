import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string().min(6, 'Confirm your password'),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
});

type ResetForm = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const uid = params.get('uid');

  const form = useForm<ResetForm>({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' } });

  const onSubmit = async (data: ResetForm) => {
    if (!token || !uid) return;
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, newPassword: data.password }),
    });
    if (res.ok) {
      toast({ title: 'Password has been reset' });
      setLocation('/auth');
    } else {
      const j = await res.json();
      toast({ title: j.message || 'Reset failed', variant: 'destructive' });
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full">Reset Password</Button>
        </form>
      </Form>
    </div>
  );
}
