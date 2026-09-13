import test from 'node:test';
import assert from 'node:assert/strict';
import { examplesAsText, courseSource } from './course-source.mjs';

test('preserves quoted and escaped transcript inputs separately from markup', () => {
	const source = `<CommandTranscript command={'echo "hello"'} output="hello" />`;
	const text = examplesAsText(source);
	assert.match(text, /echo "hello" hello/);
	assert.doesNotMatch(text, /CommandTranscript/);
});

test('resolves static script constants without running component code', () => {
	const source =
		'<script>const example = "printf \'hello\\n\'"; throw new Error("must not execute");</script><CodeBlock code={example} />';
	const text = examplesAsText(source);
	assert.match(text, /printf/);
	assert.doesNotMatch(text, /code=\{example\}/);
});

test('protects shell operators and braces from later markup stripping', () => {
	const text = examplesAsText(
		'<Code code={"${HOME}"}/><CodeBlock code={"cat notes.txt > copy.txt"} />'
	);
	assert.match(text, /\$&#123;HOME&#125;/);
	assert.match(text, /&gt; copy.txt/);
});

test('places both opening widgets before the optional definitions', () => {
	const source = courseSource('Hero.svelte');
	assert.ok(source.indexOf('id="hello-first-command"') < source.indexOf('id="keyboard-workshop"'));
	assert.ok(source.indexOf('id="keyboard-workshop"') < source.indexOf('id="section-intro-what"'));
});
