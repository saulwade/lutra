// @ts-nocheck
"use client"

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@clerk/nextjs";
import { Loader2, User, Save, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  cedula: z.string().optional(),
  specialty: z.string().optional(),
  clinicName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const nutritionist = useQuery(api.nutritionists.getCurrentNutritionist);
  const updateNutritionist = useMutation(api.nutritionists.updateNutritionist);
  const createNutritionist = useMutation(api.nutritionists.createNutritionist);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      email: "",
      cedula: "",
      specialty: "",
      clinicName: "",
      phone: "",
      address: "",
    },
  });

  // Populate form when nutritionist loads
  useEffect(() => {
    if (nutritionist) {
      reset({
        name: nutritionist.name ?? "",
        email: nutritionist.email ?? "",
        cedula: nutritionist.cedula ?? "",
        specialty: nutritionist.specialty ?? "",
        clinicName: nutritionist.clinicName ?? "",
        phone: nutritionist.phone ?? "",
        address: nutritionist.address ?? "",
      });
    } else if (user && nutritionist === null) {
      // New user, prefill from Clerk
      reset({
        name: user.fullName ?? "",
        email: user.emailAddresses[0]?.emailAddress ?? "",
      });
    }
  }, [nutritionist, user, reset]);

  async function onSubmit(data: SettingsForm) {
    try {
      if (nutritionist) {
        await updateNutritionist({
          name: data.name,
          email: data.email,
          cedula: data.cedula || undefined,
          specialty: data.specialty || undefined,
          clinicName: data.clinicName || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
        });
      } else {
        await createNutritionist({
          name: data.name,
          email: data.email,
          cedula: data.cedula || undefined,
          specialty: data.specialty || undefined,
          clinicName: data.clinicName || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
        });
      }
      toast({ title: "Perfil actualizado exitosamente" });
    } catch {
      toast({ title: "Error al guardar cambios", variant: "destructive" });
    }
  }

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      <div>
        <h1 className="text-xl font-bold">Ajustes</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Administra tu perfil profesional
        </p>
      </div>

      {nutritionist === undefined ? (
        <SettingsSkeleton />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Profile photo section */}
          <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                Foto de Perfil
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.fullName ?? ""}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
                    <span className="text-[hsl(var(--primary))] text-xl font-bold">
                      {initials}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">
                    {user?.fullName ?? "Nutriólogo"}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    La foto se gestiona desde tu cuenta Clerk
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal info */}
          <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                Información Personal
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nombre completo *</Label>
                  <Input id="name" {...register("name")} placeholder="Dra. Ana García" />
                  {errors.name && (
                    <p className="text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...register("email")} placeholder="ana@nutricion.mx" />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" {...register("phone")} placeholder="55 1234 5678" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cedula">Cédula Profesional</Label>
                  <Input id="cedula" {...register("cedula")} placeholder="12345678" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional info */}
          <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--border))]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                Información Profesional
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="specialty">Especialidad</Label>
                <Input
                  id="specialty"
                  {...register("specialty")}
                  placeholder="Nutrición clínica, deportiva, pediátrica..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="clinicName">Nombre del consultorio / clínica</Label>
                <Input
                  id="clinicName"
                  {...register("clinicName")}
                  placeholder="Centro de Nutrición Integral"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="Av. Insurgentes 1234, Col. Roma, CDMX"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className={cn(
                "bg-[hsl(var(--cta))] text-white hover:bg-[hsl(21,76%,28%)]",
                !isDirty && "opacity-50"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Guardar cambios
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--border))] p-4">
          <Skeleton className="h-5 w-32 mb-4" />
          <Separator className="mb-4" />
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
