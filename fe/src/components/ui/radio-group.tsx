// fe/src/components/ui/radio-group.tsx
import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

type RadioGroupProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
>;

const RadioGroupRoot = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, children, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-wrap gap-2", className)}
    {...props}
  >
    {children}
  </RadioGroupPrimitive.Root>
));
RadioGroupRoot.displayName = RadioGroupPrimitive.Root.displayName || "RadioGroup";

type RadioGroupItemProps = React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
>;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, children, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "flex items-center gap-1 p-2 border rounded transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary",
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="mr-2">
      <div className="h-3 w-3 rounded-full bg-primary" />
    </RadioGroupPrimitive.Indicator>
    {children}
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName =
  RadioGroupPrimitive.Item.displayName || "RadioGroupItem";

// Define an interface so that the RadioGroup component includes an Item property.
interface RadioGroupComponent
  extends React.ForwardRefExoticComponent<RadioGroupProps> {
  Item: typeof RadioGroupItem;
}

// Attach the Item component as a static property.
const RadioGroup = Object.assign(RadioGroupRoot, {
  Item: RadioGroupItem,
}) as RadioGroupComponent;

export { RadioGroup };
