import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';

import {highlight} from './entity-list.utils';

/** Texte dont la partie correspondant à la recherche est surlignée. */
@Component({
               selector: 'entity-highlight',
               template: `{{ parts().before }}@if (parts().match) {
                   <span class="el-mark">{{ parts().match }}</span>{{ parts().after }}
               }`,
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class EntityHighlightComponent {
    readonly text = input<string | null>('');
    readonly query = input<string>('');

    readonly parts = computed(() => highlight(this.text(), this.query()));
}
