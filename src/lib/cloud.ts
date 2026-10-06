import {createClient} from '@supabase/supabase-js';
import {isSave,snapshot,useGame} from './store';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const cloud=url&&key?createClient(url,key):null;
async function user(){if(!cloud)throw Error('클라우드가 연결되지 않았습니다. 현재 기기에 자동 저장됩니다.');const {data,error}=await cloud.auth.getUser();if(!error&&data.user)return data.user;const result=await cloud.auth.signInAnonymously();if(result.error)throw result.error;return result.data.user!;}
export async function saveCloud(){const u=await user();const {error}=await cloud!.from('game_sessions').upsert({user_id:u.id,state:snapshot(useGame.getState()),updated_at:new Date().toISOString()});if(error)throw error;return '클라우드 저장 완료';}
export async function loadCloud(){const u=await user();const {data,error}=await cloud!.from('game_sessions').select('state').eq('user_id',u.id).maybeSingle();if(error)throw error;if(!data)throw Error('저장된 클라우드 기록이 없습니다.');if(!isSave(data.state))throw Error('저장 형식이 올바르지 않습니다.');useGame.getState().restore(data.state);return '클라우드 기록을 불러왔습니다.';}
