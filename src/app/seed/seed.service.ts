import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class SeedService {

  firestore = inject(Firestore);

  async generar(eventoId: string) {
    const ref = collection(this.firestore, 'inscripciones');

    for (let i = 1; i <= 20; i++) {
      await addDoc(ref, {
        uid: `test_${i}`,
        eventoId,
        nombreEstudiante: `Estudiante ${i}`,
        correoEstudiante: `est${i}@mail.com`,
        carrera: "Informatica",
        fechaInscripcion: new Date(),
        asistencia: false,
        horasGanadas: 0,
      });
    }

    return "✔ SEED COMPLETO";
  }
}
