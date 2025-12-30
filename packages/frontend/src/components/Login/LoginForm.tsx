import React from "react";
import { formOptions, useForm } from "@tanstack/react-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { clientApp } from "@/lib/clientAPI";

const PUBLIC_FRONTEND_URL = import.meta.env.PUBLIC_FRONTEND_URL as string;

interface FormData {
  email: string;
  contraseña: string;
}

// Google Sign-in Button Component
const GoogleSignInButton = () => (
  <a href={`${PUBLIC_FRONTEND_URL}/api/auth/google`} className="w-full">
    <button
      type="button"
      aria-label="Sign in with Google"
      className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white p-2 transition-colors hover:bg-gray-50"
    >
      <div className="mr-3 flex h-5 w-5 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-5 w-5"
        >
          <title>Sign in with Google</title>
          <desc>Google G Logo</desc>
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            className="fill-blue-500"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            className="fill-green-500"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            className="fill-yellow-500"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            className="fill-red-500"
          />
        </svg>
      </div>
      <span className="text-sm font-medium tracking-wider">
        Continuar con Google
      </span>
    </button>
  </a>
);

// Email validation helper
const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Por favor introduce un email válido";
  }
  return null;
};

export default function LoginForm() {
  const [loginError, setLoginError] = React.useState<string | null>(null);

  const formOpts = formOptions({
    defaultValues: {
      email: "",
      contraseña: "",
    } as FormData,
  });

  const form = useForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      setLoginError(null);

      try {
        const response = await clientApp.auth.login.post({
          email: value.email,
          password: value.contraseña,
        });

        const data = response.data;

        if (data?.ok) {
          window.location.assign(import.meta.env.PUBLIC_FRONTEND_URL + "/");
          return undefined;
        }

        setLoginError("Usuario o contraseña incorrectos");
        return "Usuario o contraseña incorrectos";
      } catch (error) {
        console.error("Login error:", error);
        setLoginError("Error de conexión. Por favor inténtalo de nuevo.");
        return "Error de conexión";
      }
    },
  });

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="text-muted-foreground text-sm">
          Accede a tu cuenta para continuar
        </p>
      </div>

      <div className="space-y-3">
        <GoogleSignInButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-50 text-muted-foreground px-2">
              O continúa con email
            </span>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div className="grid w-full items-center gap-4">
          {/* Email */}
          <div className="flex flex-col space-y-1.5">
            <form.Field
              name="email"
              validators={{
                onChange: ({ value, fieldApi }) => {
                  if (fieldApi.getMeta().isDirty) {
                    if (value.length === 0)
                      return "El email no puede estar vacío";
                    return validateEmail(value);
                  }
                  return null;
                },
                onSubmit: ({ value }) =>
                  value.length === 0
                    ? "El email no puede estar vacío"
                    : validateEmail(value),
              }}
            >
              {(field) => (
                <>
                  <Label htmlFor={field.name}>Email*</Label>
                  <Input
                    name={field.name}
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={
                      field.state.meta.errors.length > 0 ? "border-red-500" : ""
                    }
                    autoComplete="email"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-sm text-red-500" role="alert">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </>
              )}
            </form.Field>
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1.5">
            <form.Field
              name="contraseña"
              validators={{
                onChange: ({ value, fieldApi }) => {
                  if (fieldApi.getMeta().isDirty) {
                    if (value.length === 0)
                      return "La contraseña no puede estar vacía";
                  }
                  return null;
                },
                onSubmit: ({ value }) =>
                  value.length === 0
                    ? "La contraseña no puede estar vacía"
                    : null,
              }}
            >
              {(field) => (
                <>
                  <Label htmlFor={field.name}>Contraseña*</Label>
                  <Input
                    name={field.name}
                    type="password"
                    placeholder="Introduce tu contraseña"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={
                      field.state.meta.errors.length > 0 ? "border-red-500" : ""
                    }
                    autoComplete="current-password"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <span className="text-sm text-red-500" role="alert">
                      {field.state.meta.errors.join(", ")}
                    </span>
                  )}
                </>
              )}
            </form.Field>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col space-y-3">
            {/* Error Display */}
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de inicio de sesión</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </form>
    </div>
  );
}
