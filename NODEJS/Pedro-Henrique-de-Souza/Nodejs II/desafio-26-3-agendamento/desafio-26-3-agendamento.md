# Desafio 26.3 — Serviço de Agendamento em Memória

Implementação de `scheduleAppointment`, que recebe `professionalId`, `serviceId`, `startAt` e `durationMinutes`, impede duração inválida e impede conflito de horário para o mesmo profissional. Seguindo a mesma arquitetura incremental do módulo (validação → regra de negócio → repositório).

## Estrutura de pastas

```text
src/
├── app.js
└── modules/
    └── appointments/
        ├── appointment-validator.js
        ├── appointment-repository.js
        └── appointment-service.js
```

**Como executar:** crie a estrutura acima, um `package.json` com `"type": "module"`, e rode `node src/app.js`.

---

## `src/modules/appointments/appointment-validator.js`
```javascript
const MIN_APPOINTMENT_DURATION_MINUTES = 1;

export function validateAppointmentInput(input) {
  const professionalId = input?.professionalId?.trim();
  const serviceId = input?.serviceId?.trim();
  const startAt = new Date(input?.startAt);
  const durationMinutes = Number(input?.durationMinutes);

  if (!professionalId) {
    throw new Error("professionalId é obrigatório.");
  }

  if (!serviceId) {
    throw new Error("serviceId é obrigatório.");
  }

  if (Number.isNaN(startAt.getTime())) {
    throw new Error("startAt deve ser uma data/hora válida (ISO 8601).");
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes < MIN_APPOINTMENT_DURATION_MINUTES) {
    throw new Error("durationMinutes deve ser um número inteiro maior que zero.");
  }

  return { professionalId, serviceId, startAt, durationMinutes };
}
```

## `src/modules/appointments/appointment-repository.js`
```javascript
import { randomUUID } from "node:crypto";

const appointments = [];

export function save(appointment) {
  const newAppointment = { ...appointment, id: randomUUID() };
  appointments.push(newAppointment);
  return { ...newAppointment };
}

export function findAll() {
  return appointments.map((appointment) => ({ ...appointment }));
}

export function findByProfessionalId(professionalId) {
  return appointments
    .filter((appointment) => appointment.professionalId === professionalId)
    .map((appointment) => ({ ...appointment }));
}
```

## `src/modules/appointments/appointment-service.js`
```javascript
import { validateAppointmentInput } from "./appointment-validator.js";
import { save, findByProfessionalId } from "./appointment-repository.js";

// Função pura: calcula o horário de término a partir do início e da duração.
export function calculateEndAt(startAt, durationMinutes) {
  return new Date(startAt.getTime() + durationMinutes * 60_000);
}

// Função pura: dois intervalos se sobrepõem quando um começa antes do
// outro terminar E vice-versa.
export function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

// Função pura: procura, entre os agendamentos existentes, algum conflito.
export function findConflictingAppointment(existingAppointments, startAt, endAt) {
  return (
    existingAppointments.find((appointment) => {
      const existingEndAt = calculateEndAt(appointment.startAt, appointment.durationMinutes);
      return overlaps(startAt, endAt, appointment.startAt, existingEndAt);
    }) ?? null
  );
}

export function scheduleAppointment(input) {
  const data = validateAppointmentInput(input);
  const endAt = calculateEndAt(data.startAt, data.durationMinutes);

  const existingAppointments = findByProfessionalId(data.professionalId);
  const conflict = findConflictingAppointment(existingAppointments, data.startAt, endAt);

  if (conflict) {
    const conflictEndAt = calculateEndAt(conflict.startAt, conflict.durationMinutes);
    const timeZone = "America/Sao_Paulo";
    throw new Error(
      `Conflito de horário: o profissional já possui um agendamento das ` +
        `${conflict.startAt.toLocaleTimeString("pt-BR", { timeZone })} às ` +
        `${conflictEndAt.toLocaleTimeString("pt-BR", { timeZone })}.`,
    );
  }

  return save({ ...data, endAt });
}
```

## `src/app.js`
```javascript
import { scheduleAppointment } from "./modules/appointments/appointment-service.js";

const TIME_ZONE = "America/Sao_Paulo";

function formatTime(date) {
  return date.toLocaleTimeString("pt-BR", { timeZone: TIME_ZONE });
}

function trySchedule(label, input) {
  try {
    const appointment = scheduleAppointment(input);
    console.log(
      `[OK] ${label}: agendado das ${formatTime(appointment.startAt)} ` +
        `às ${formatTime(appointment.endAt)} (prof: ${appointment.professionalId})`,
    );
    return appointment;
  } catch (error) {
    console.error(`[ERRO] ${label}: ${error.message}`);
    return null;
  }
}

console.log("=== Cenário base (exemplo do enunciado) ===");
trySchedule("Agendamento inicial", {
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
});

console.log("\n=== Tentando agendar com conflito de horário (mesmo profissional) ===");
trySchedule("Sobreposição parcial (14:30-15:15)", {
  professionalId: "prof-1",
  serviceId: "service-2",
  startAt: "2026-09-10T14:30:00-03:00",
  durationMinutes: 45,
});

console.log("\n=== Agendando em horário livre (sem conflito) ===");
trySchedule("Horário livre (14:45-15:15)", {
  professionalId: "prof-1",
  serviceId: "service-2",
  startAt: "2026-09-10T14:45:00-03:00",
  durationMinutes: 30,
});

console.log("\n=== Mesmo horário, mas profissional DIFERENTE (não deve conflitar) ===");
trySchedule("Outro profissional, mesmo horário", {
  professionalId: "prof-2",
  serviceId: "service-1",
  startAt: "2026-09-10T14:00:00-03:00",
  durationMinutes: 45,
});

console.log("\n=== Duração inválida ===");
trySchedule("Duração zero", {
  professionalId: "prof-1",
  serviceId: "service-1",
  startAt: "2026-09-10T16:00:00-03:00",
  durationMinutes: 0,
});

console.log("\n=== Campos obrigatórios ausentes ===");
trySchedule("Sem professionalId", {
  serviceId: "service-1",
  startAt: "2026-09-10T16:00:00-03:00",
  durationMinutes: 30,
});
```

---

## Log de execução (`node src/app.js`)

```
=== Cenário base (exemplo do enunciado) ===
[OK] Agendamento inicial: agendado das 14:00:00 às 14:45:00 (prof: prof-1)

=== Tentando agendar com conflito de horário (mesmo profissional) ===
[ERRO] Sobreposição parcial (14:30-15:15): Conflito de horário: o profissional já possui um agendamento das 14:00:00 às 14:45:00.

=== Agendando em horário livre (sem conflito) ===
[OK] Horário livre (14:45-15:15): agendado das 14:45:00 às 15:15:00 (prof: prof-1)

=== Mesmo horário, mas profissional DIFERENTE (não deve conflitar) ===
[OK] Outro profissional, mesmo horário: agendado das 14:00:00 às 14:45:00 (prof: prof-2)

=== Duração inválida ===
[ERRO] Duração zero: durationMinutes deve ser um número inteiro maior que zero.

=== Campos obrigatórios ausentes ===
[ERRO] Sem professionalId: professionalId é obrigatório.
```

Os seis cenários confirmam a regra: agendamento normal funciona, sobreposição de horário para o **mesmo** profissional é bloqueada, um horário adjacente (14:45, logo após o término às 14:45) é permitido, o **mesmo horário** para um profissional **diferente** não gera conflito, duração zero é rejeitada na validação, e campo obrigatório ausente também é barrado antes de chegar à regra de conflito.

---

## Discussão (perguntas do enunciado)

**Onde deveria ficar a regra de conflito?**
No `appointment-service.js` (a camada de caso de uso), não no repositório nem no validador. O validador só entende formato (é uma data válida? é um inteiro positivo?). O repositório só entende como guardar e consultar dados brutos. A regra "não pode haver dois agendamentos sobrepostos para o mesmo profissional" é uma **regra de negócio** — ela só faz sentido quando já se tem os dados existentes em mãos e uma decisão a tomar sobre eles, o que é exatamente o papel do `service`.

**O repositório deve decidir se um horário é permitido?**
Não. O repositório (`appointment-repository.js`) deve continuar "burro": ele só sabe salvar e buscar. Se a regra de conflito fosse movida para lá, o repositório passaria a conhecer regras de negócio, o que dificultaria trocá-lo por outro mecanismo de persistência (ex.: PostgreSQL) sem also reescrever a regra.

**O que acontecerá quando existirem duas requisições simultâneas?**
Com o array em memória e execução single-threaded do JavaScript, duas chamadas *síncronas* como as deste exercício não têm risco de corrida. Mas em um cenário real com I/O assíncrono (ex.: banco de dados), duas requisições concorrentes poderiam ambas consultar "não há conflito" e ambas tentarem salvar antes que a outra termine — uma condição de corrida clássica (*race condition*). A solução definitiva exigiria uma restrição a nível de banco (ex.: `EXCLUDE CONSTRAINT` no PostgreSQL) ou um mecanismo de lock, não apenas a checagem em memória feita aqui.

**Quais partes dessa solução mudarão quando o banco PostgreSQL for introduzido?**
Só o `appointment-repository.js` muda — a forma de `save` e `findByProfessionalId` passaria a fazer `INSERT`/`SELECT` no banco em vez de manipular um array. O `appointment-validator.js` e o `appointment-service.js` (incluindo a regra de conflito, que é lógica pura sobre datas) permanecem exatamente iguais, porque nunca souberam como os dados são armazenados.
