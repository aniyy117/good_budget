"use client";

import * as React from "react";

import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Currencies, Currency } from "@/lib/currencies";
import { apiGet } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SkeletonWrapper from "./SkeletonWrapper";
import type { UserSettings } from "@/lib/types";
import { UpdateUserCurrency } from "@/app/wizard/_actions/userSettings";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CurrencyComboBox({
  warnOnChange = false,
}: {
  warnOnChange?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingCurrency, setPendingCurrency] = React.useState<Currency | null>(
    null
  );
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedOption, setSelectedOption] = React.useState<Currency | null>(
    null
  );
  const queryClient = useQueryClient();
  const router = useRouter();

  const userSettings = useQuery<UserSettings | null>({
    queryKey: ["userSettings"],
    queryFn: () => apiGet<UserSettings | null>("/api/user-settings"),
  });

  React.useEffect(() => {
    if (!userSettings.data) return;
    const userCurrency = Currencies.find(
      (currency) => currency.value === userSettings.data?.currency
    );
    if (userCurrency) setSelectedOption(userCurrency);
  }, [userSettings.data]);

  const mutation = useMutation({
    mutationFn: UpdateUserCurrency,
    onSuccess: async (data: UserSettings) => {
      toast.success(`Currency updated successfully 🎉`, {
        id: "update-currency",
      });

      setSelectedOption(
        Currencies.find((c) => c.value === data.currency) || null
      );

      await queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      // Dashboard formatters come from RSC-passed settings — refresh server tree.
      router.refresh();
    },
    onError: () => {
      toast.error("Something went wrong", {
        id: "update-currency",
      });
    },
  });

  const saveCurrency = React.useCallback(
    (currency: Currency) => {
      toast.loading("Saving currency...", {
        id: "update-currency",
      });
      mutation.mutate(currency.value);
    },
    [mutation]
  );

  const selectOption = React.useCallback(
    (currency: Currency | null) => {
      if (!currency) {
        toast.error("Please select a currency");
        return;
      }

      if (userSettings.data?.currency === currency.value) {
        return;
      }

      if (warnOnChange && userSettings.data) {
        setPendingCurrency(currency);
        setConfirmOpen(true);
        return;
      }

      saveCurrency(currency);
    },
    [saveCurrency, userSettings.data, warnOnChange]
  );

  const combo = isDesktop ? (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={mutation.isPending}
        >
          {selectedOption ? <>{selectedOption.label}</> : <>Set currency</>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <OptionList setOpen={setOpen} setSelectedOption={selectOption} />
      </PopoverContent>
    </Popover>
  ) : (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={mutation.isPending}
        >
          {selectedOption ? <>{selectedOption.label}</> : <>Set currency</>}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          <OptionList setOpen={setOpen} setSelectedOption={selectOption} />
        </div>
      </DrawerContent>
    </Drawer>
  );

  return (
    <SkeletonWrapper isLoading={userSettings.isFetching}>
      {combo}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) setPendingCurrency(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change base currency?</AlertDialogTitle>
            <AlertDialogDescription>
              Past transactions keep their original currency and saved
              conversions. Dashboard totals stay based on those snapshots. Only
              new transactions will use{" "}
              {pendingCurrency?.label ?? "the selected currency"} as the base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingCurrency) return;
                saveCurrency(pendingCurrency);
                setPendingCurrency(null);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SkeletonWrapper>
  );
}

function OptionList({
  setOpen,
  setSelectedOption,
}: {
  setOpen: (open: boolean) => void;
  setSelectedOption: (status: Currency | null) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Filter currency..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {Currencies.map((currency: Currency) => (
            <CommandItem
              key={currency.value}
              value={currency.value}
              onSelect={(value) => {
                setSelectedOption(
                  Currencies.find((priority) => priority.value === value) ||
                    null
                );
                setOpen(false);
              }}
            >
              {currency.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
