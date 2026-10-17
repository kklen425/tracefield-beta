import {createFileRoute} from '@tanstack/react-router';
import {FieldApp} from '@/components/trace/field-app';
import {PersonalContext} from '@/lib/personal/context';

export const Route=createFileRoute('/personal')({component:Personal,head:()=>({meta:[{title:'TRACEFIELD · Personal'},{name:'robots',content:'noindex, nofollow'}]})});
function Personal(){return <PersonalContext.Provider value={true}><FieldApp/></PersonalContext.Provider>;}
