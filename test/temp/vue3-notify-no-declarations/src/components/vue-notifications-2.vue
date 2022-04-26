<script setup lang="ts">
import type { StyleValue } from 'vue';
import { onMounted } from 'vue';

import type {
	NotificationItemWithTimer,
	NotificationsOptions,
} from '~/types/notification.js';
import { listToDirection } from '~/utils/direction.js';
import { emitter } from '~/utils/events.js';
import { generateId } from '~/utils/id.js';
import { parseNumericValue } from '~/utils/parser.js';
import { Timer } from '~/utils/timer.js';

// eslint-disable-next-line vue/no-setup-props-destructure
const {
	group = '',
	width = 300,
	reverse = false,
	position = ['top', 'right'],
	classes = 'vue-notification',
	animationName = 'vn-fade',
	speed: speedProp = 300,
	cooldown: _cooldown = 0,
	duration: durationProp = 3000,
	delay: _delay = 0,
	max: maxNotifications = Number.POSITIVE_INFINITY,
	ignoreDuplicates: ignoreDuplicatesProp = false,
	closeOnClick = true,
	pauseOnHover = false,
} = defineProps<{
	group?: string;
	width?: number | string;
	reverse?: boolean;
	position?: string | string[];
	classes?: string;
	animationName?: string;
	speed?: number;
	cooldown?: number;
	duration?: number;
	delay?: number;
	max?: number;
	ignoreDuplicates?: boolean;
	closeOnClick?: boolean;
	pauseOnHover?: boolean;
}>();

const emit = defineEmits<{
	(event: 'click', item: NotificationItemExtended): void;
	(event: 'destroy', item: NotificationItemExtended): void;
}>();

const STATE = {
	IDLE: 0,
	DESTROYED: 2,
} as const;

type NotificationItemState = typeof STATE;

type NotificationItemExtended = NotificationItemWithTimer & {
	state: NotificationItemState[keyof NotificationItemState];
};

let list = $ref<NotificationItemExtended[]>([]);
let timerControl = $ref<Timer | undefined>();

const actualWidth = $computed(() => parseNumericValue(width));
const styles = $computed((): StyleValue => {
	const { x, y } = listToDirection(position);
	const width = actualWidth.value;
	const suffix = actualWidth.type;

	const styles: Record<string, string> = {
		width: String(width) + suffix,
	};

	if (y) {
		styles[y] = '0px';
	}

	if (x) {
		if (x === 'center') {
			styles.left = `calc(50% - ${Number(width) / 2}${suffix})`;
		} else {
			styles[x] = '0px';
		}
	}

	return styles;
});

const activeNotifications = $computed(() =>
	list.filter((v) => v.state !== STATE.DESTROYED)
);
const bottomToTop = $computed(() =>
	Object.prototype.hasOwnProperty.call(styles, 'bottom')
);

onMounted(() => {
	emitter.on('add', addItem);
	emitter.on('close', closeItem);
});

function destroyIfNecessary(item: NotificationItemExtended) {
	emit('click', item);
	if (closeOnClick) {
		destroy(item);
	}
}

function pauseTimeout() {
	if (pauseOnHover) {
		timerControl?.pause();
	}
}

function resumeTimeout() {
	if (pauseOnHover) {
		timerControl?.resume();
	}
}

function addItem(event: NotificationsOptions = {}): void {
	event.group ??= '';
	event.data ??= {};

	if (group !== event.group) {
		return;
	}

	if (event.clear) {
		destroyAll();
		return;
	}

	const duration =
		typeof event.duration === 'number' ? event.duration : durationProp;

	const speed = typeof event.speed === 'number' ? event.speed : speedProp;

	const ignoreDuplicates =
		typeof event.ignoreDuplicates === 'boolean'
			? event.ignoreDuplicates
			: ignoreDuplicatesProp;

	const { title, text, type, data, id } = event;

	const item: NotificationItemExtended = {
		id: id ?? generateId(),
		title,
		text,
		type,
		state: STATE.IDLE,
		speed,
		length: duration + 2 * speed,
		data,
	};

	if (duration >= 0) {
		timerControl = new Timer(
			() => {
				destroy(item);
			},
			item.length,
			item
		);
	}

	const direction = reverse ? !bottomToTop : bottomToTop;

	let indexToDestroy = -1;

	const isDuplicate = activeNotifications.some(
		(i) => i.title === event.title && i.text === event.text
	);

	const canAdd = ignoreDuplicates ? !isDuplicate : true;

	if (!canAdd) {
		return;
	}

	if (direction) {
		list.push(item);

		if (activeNotifications.length > maxNotifications) {
			indexToDestroy = 0;
		}
	} else {
		list.unshift(item);

		if (activeNotifications.length > maxNotifications) {
			indexToDestroy = activeNotifications.length - 1;
		}
	}

	if (indexToDestroy !== -1) {
		destroy(activeNotifications[indexToDestroy]!);
	}
}

function closeItem(id: unknown) {
	destroyById(id);
}

function notifyClass(item: NotificationItemExtended): string[] {
	return ['vue-notification-template', classes, item.type ?? ''];
}

function notifyWrapperStyle(item: NotificationItemExtended) {
	return { transition: `all ${item.speed!}ms` };
}

function destroy(item: NotificationItemExtended): void {
	if (item.timer !== undefined) {
		clearTimeout(item.timer);
	}

	item.state = STATE.DESTROYED;

	clean();

	emit('destroy', item);
}

function destroyById(id: unknown): void {
	const item = list.find((v) => v.id === id);

	if (item) {
		destroy(item);
	}
}

function destroyAll(): void {
	for (const activeNotification of activeNotifications) {
		destroy(activeNotification);
	}
}

function clean() {
	list = list.filter((v) => v.state !== STATE.DESTROYED);
}

defineExpose({
	addItem,
	list: list as NotificationItemExtended[],
});
</script>

<template>
	<div class="vue-notification-group" :style="styles">
		<transition-group tag="span" :name="animationName">
			<div
				v-for="item in activeNotifications"
				:key="item.id"
				class="vue-notification-wrapper"
				:style="notifyWrapperStyle(item)"
				:data-id="item.id"
				@mouseenter="pauseTimeout"
				@mouseleave="resumeTimeout"
			>
				<slot
					name="body"
					:class="[classes, item.type]"
					:item="item"
					:close="() => destroy(item)"
				>
					<!-- Default slot template -->
					<div :class="notifyClass(item)" @click="destroyIfNecessary(item)">
						<div
							v-if="item.title"
							class="notification-title"
							v-html="item.title"
						></div>
						<div class="notification-content" v-html="item.text"></div>
					</div>
				</slot>
			</div>
		</transition-group>
	</div>
</template>

<style>
.vue-notification-group {
	display: block;
	position: fixed;
	z-index: 5000;
}

.vue-notification-wrapper {
	display: block;
	overflow: hidden;
	width: 100%;
	margin: 0;
	padding: 0;
}

.notification-title {
	font-weight: 600;
}

.vue-notification-template {
	display: block;
	box-sizing: border-box;
	background: white;
	text-align: left;
}

.vue-notification {
	display: block;
	box-sizing: border-box;
	text-align: left;
	font-size: 12px;
	padding: 10px;
	margin: 0 5px 5px;

	color: white;
	background: #44a4fc;
	border-left: 5px solid #187fe7;
}

.vue-notification.warn {
	background: #ffb648;
	border-left-color: #f48a06;
}

.vue-notification.error {
	background: #e54d42;
	border-left-color: #b82e24;
}

.vue-notification.success {
	background: #68cd86;
	border-left-color: #42a85f;
}

.vn-fade-enter-active,
.vn-fade-leave-active,
.vn-fade-move {
	transition: all 0.5s;
}

.vn-fade-enter-from,
.vn-fade-leave-to {
	opacity: 0;
}
</style>
