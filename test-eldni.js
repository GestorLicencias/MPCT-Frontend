const axios = require('axios');
async function test() {
  try {
    const res1 = await axios.get('https://eldni.com/buscar-por-dni');
    const html = res1.data;
    const tokenMatch = html.match(/name="_token" value="([^"]+)"/);
    if(!tokenMatch) throw new Error('No token');
    const token = tokenMatch[1];
    
    // Some cookies like XSRF-TOKEN and eldni_session
    const cookies = res1.headers['set-cookie'] ? res1.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';
    
    console.log("Token:", token);
    console.log("Cookies:", cookies);
    
    const params = new URLSearchParams();
    params.append('_token', token);
    params.append('dni', '73335504');
    
    const res2 = await axios.post('https://eldni.com/pe/buscar-datos-por-dni', params, {
      headers: {
        'Cookie': cookies,
        'Referer': 'https://eldni.com/buscar-por-dni',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log("Response:", res2.data.substring(0, 500));
  } catch(e) {
    console.error("Error:", e.message);
    if(e.response) console.error(e.response.status, e.response.statusText);
  }
}
test();
