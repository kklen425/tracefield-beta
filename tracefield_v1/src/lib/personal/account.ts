import * as server from '@/lib/account/entitlements';
import {usePersonal} from './context';
import {personalAccount} from './store';

// Personal operations never call account endpoints or grant a server entitlement.
export function useWorkspaceAccount() {
 return usePersonal()?personalAccount:server;
}
