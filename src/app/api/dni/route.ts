import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('numero');

  if (!dni || dni.length !== 8) {
    return NextResponse.json({ message: 'DNI inválido' }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://api.apis.net.pe/v1/dni?numero=${dni}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://apis.net.pe/'
      }
    });
    
    if (response.data && response.data.nombre) {
        return NextResponse.json({
            nombreCompleto: response.data.nombre
        });
    }
    
    return NextResponse.json({ message: 'No se encontraron datos para este DNI' }, { status: 404 });

  } catch (error: any) {
    console.error("Error fetching DNI from apis.net.pe:", error.message);
    if (error.response) {
       console.error("Data:", error.response.data);
       console.error("Status:", error.response.status);
    }
    return NextResponse.json(
      { message: 'Error al consultar el servicio externo' },
      { status: 500 }
    );
  }
}
