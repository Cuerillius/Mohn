import { useQuery } from "@tanstack/react-query";
import { keys } from "@/lib/queryKeys";
import { fetchPlan } from "../torbox";
import { capabilities, getPlatform, type Platform } from "../platform";

const PRO_PLAN = 2; // 0=Free, 1=Essential, 2=Pro, 3=Standard

export interface TorboxAccess {
  resolved: boolean;
  allowed: boolean;
  plan: number | undefined;
}

export function useTorboxAccess(
  platform: Platform = getPlatform(),
): TorboxAccess {
  const requiresPro = capabilities(platform).requiresPro;

  const { data: plan, isLoading } = useQuery({
    queryKey: keys.torboxPlan(),
    queryFn: fetchPlan,
    enabled: requiresPro,
    staleTime: 5 * 60 * 1000,
  });

  if (!requiresPro) {
    return { resolved: true, allowed: true, plan };
  }
  if (isLoading || plan === undefined) {
    return { resolved: false, allowed: false, plan };
  }
  return { resolved: true, allowed: plan === PRO_PLAN, plan };
}
