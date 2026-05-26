import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dni = searchParams.get('numero');

  if (!dni || dni.length !== 8) {
    return NextResponse.json({ message: 'DNI inválido' }, { status: 400 });
  }

    try {
        const response = await axios.get(`https://mpct-api-264213836001.us-east1.run.app/api/v1/tramites/dni/${dni}`);
        
        if (response.data && response.data.nombreCompleto) {
            return NextResponse.json({
                nombreCompleto: response.data.nombreCompleto
            });
        }
        
        return NextResponse.json({ message: 'No se encontraron datos para este DNI' }, { status: 404 });

  } catch (error: any) {
    console.error("Error fetching DNI from apis.net.pe:", error.message);
    return NextResponse.json(
      { message: 'Error al consultar el servicio externo' },
      { status: 500 }
    );
  }
}
