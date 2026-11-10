import assert from 'node:assert/strict';
import handler from '../api/contact.js';
process.env.RECAPTCHA_SECRET_KEY='test-only';process.env.RESEND_API_KEY='test-only';process.env.RESEND_TO_EMAIL='qa@example.com';process.env.RESEND_FROM_EMAIL='qa@example.com';
let sent=0;globalThis.fetch=async url=>{if(url.includes('siteverify'))return {json:async()=>({success:true,score:.9,action:'contact_submit'})};sent++;return {ok:true}};
async function call(body,method='POST'){const res={code:0,setHeader(){},status(n){this.code=n;return this},json(data){this.data=data;return this}};await handler({body,method},res);return res;}
for(const body of ['{',null,[],{name:12}, {name:'QA',email:'bad',message:'Test'}])assert.equal((await call(body)).code,400);
assert.equal((await call({},'GET')).code,405);assert.equal((await call({website:'bot'})).code,200);assert.equal(sent,0);
const valid={name:'QA',email:'qa@example.com',message:'Test only',recaptchaToken:'test'};assert.equal((await call(valid)).code,200);assert.equal(sent,1);
globalThis.fetch=async()=>{throw new Error('mock network failure')};assert.equal((await call(valid)).code,502);
console.log('PASS malformed bodies, field types, method, honeypot, mocked delivery and recaptcha outage. No external network.');
