import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';

import { TimelineData } from '../model/timeline-data';
import { TimelineRoom } from '../model/timeline-room';

@Component({
  selector: 'app-timeline-config-rooms-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, InputTextModule],
  templateUrl: './timeline-config-rooms-dialog.component.html',
})
export class TimelineConfigRoomsDialogComponent {
  _draft = signal<TimelineData | null>(null);

  @Input({ required: true })
  set data(value: TimelineData) {
    this._draft.set(structuredClone(value));
  }

  @Output() confirmDraft = new EventEmitter<TimelineData>();
  @Output() cancelDraft = new EventEmitter<void>();

  rooms = computed(() => this._draft()?.rooms ?? []);

  // stabilise DOM
  trackById = (_: number, item: { id: string }) => item.id;

  // Drafts de saisie
  private roomLabelDraft = signal<Record<string, string>>({});

  roomLabel(room: TimelineRoom): string {
    return this.roomLabelDraft()[room.id] ?? room.label;
  }

  setRoomLabelDraft(roomId: string, value: string) {
    this.roomLabelDraft.update(m => ({ ...m, [roomId]: value }));
  }

  commitRoomLabel(roomId: string) {
    const value = this.roomLabelDraft()[roomId];
    if (value === undefined) return;

    const v = value.trim();
    if (!v) return;

    this.commit(next => {
      const r = next.rooms.find(x => x.id === roomId);
      if (r) r.label = v;
    });

    this.roomLabelDraft.update(m => {
      const copy = { ...m };
      delete copy[roomId];
      return copy;
    });
  }

  addRoom() {
    this.commit(next => next.rooms.push({ id: this.newId(), label: 'Nouvelle salle' }));
  }

  deleteRoom(roomId: string) {
    // supprime la salle + nettoie toutes les assignations (comme ton code)
    this.commit(next => {
      next.rooms = next.rooms.filter(r => r.id !== roomId);
      next.days = next.days.map(d => ({ ...d, rooms: d.rooms.filter(rd => rd.roomId !== roomId) }));
    });
  }

  confirm() {
    const d = this._draft();
    if (!d) return;
    this.confirmDraft.emit(structuredClone(d));
  }

  cancel() {
    this.cancelDraft.emit();
  }

  private commit(mutator: (next: TimelineData) => void) {
    const current = this._draft();
    if (!current) return;
    const next = structuredClone(current);
    mutator(next);
    this._draft.set(next);
  }

  private newId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }
}