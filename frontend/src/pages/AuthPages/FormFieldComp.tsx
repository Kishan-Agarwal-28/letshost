import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
const FormFieldComp = ({
  form,
  needLabel = true,
  needDescription = true,
  needPlaceholder = true,
  type = "text",
  enabled = true,
  className,
  name,
  labelValue,
  descriptionValue,
  placeholderValue,
  value,
}: {
  form: UseFormReturn<any>;
  needLabel?: boolean;
  needDescription?: boolean;
  needPlaceholder?: boolean;
  type?: string;
  enabled?: boolean;
  className?: string;
  name: string;
  labelValue: string;
  descriptionValue: string;
  placeholderValue: string;
  value?: string;
}) => {
  if (!form || !form.control) {
    return null; // Avoid rendering if form.control is not available
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {needLabel && <FormLabel>{labelValue}</FormLabel>}
          <FormControl>
            <Input
              placeholder={needPlaceholder ? placeholderValue : ""}
              {...field}
              type={type}
              disabled={!enabled}
              value={value}
            />
          </FormControl>
          {needDescription && (
            <FormDescription>{descriptionValue}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
export default FormFieldComp;
