import {createContext, useContext} from 'react';

export const PersonalContext = createContext(false);
export const usePersonal = () => useContext(PersonalContext);
export const PERSONAL_USER = {id:'personal-local',displayName:'Personal workspace',primaryEmail:null,profileImageUrl:null,isDevFallback:true};
