#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const profilePath = process.argv[2] || '.profile/profiling-data.11-07-2025.19-21-51.json';
const data = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

console.log('=== React Profiler Analysis ===\n');
console.log(`Version: ${data.version}`);
console.log(`Number of roots: ${data.dataForRoots.length}\n`);

data.dataForRoots.forEach((rootData, rootIndex) => {
  console.log(`\n--- Root ${rootIndex + 1} ---`);
  console.log(`Total commits: ${rootData.commitData.length}`);

  // Analyze commit durations
  const durations = rootData.commitData.map(commit => commit.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  console.log(`\nCommit Durations:`);
  console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Max: ${maxDuration.toFixed(2)}ms`);
  console.log(`  Min: ${minDuration.toFixed(2)}ms`);

  // Find slow commits (over 16ms = 60fps threshold)
  const slowCommits = rootData.commitData
    .map((commit, index) => ({ ...commit, index }))
    .filter(commit => commit.duration > 16)
    .sort((a, b) => b.duration - a.duration);

  if (slowCommits.length > 0) {
    console.log(`\n⚠️  Slow commits (>${16}ms, dropping below 60fps):`);
    console.log(`  Total: ${slowCommits.length} / ${durations.length} commits`);
    console.log(`\n  Top 10 slowest commits:`);
    slowCommits.slice(0, 10).forEach((commit, i) => {
      console.log(`    ${i + 1}. Commit #${commit.index}: ${commit.duration.toFixed(2)}ms`);
      console.log(`       Priority: ${commit.priorityLevel}`);
      console.log(`       Components updated: ${commit.changeDescriptions?.length || 0}`);
    });
  }

  // Analyze components that changed most frequently
  const componentChangeCounts = {};
  rootData.commitData.forEach(commit => {
    if (commit.changeDescriptions) {
      commit.changeDescriptions.forEach(([fiberId, changeDesc]) => {
        componentChangeCounts[fiberId] = (componentChangeCounts[fiberId] || 0) + 1;
      });
    }
  });

  const frequentChanges = Object.entries(componentChangeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (frequentChanges.length > 0) {
    console.log(`\n  Components that re-rendered most frequently:`);
    frequentChanges.forEach(([fiberId, count]) => {
      const fiber = rootData.snapshots?.[0]?.find(f => f.id === parseInt(fiberId));
      const displayName = fiber?.displayName || `Fiber #${fiberId}`;
      console.log(`    ${displayName}: ${count} re-renders`);
    });
  }

  // Analyze fiber tree from first snapshot
  if (rootData.snapshots && rootData.snapshots[0]) {
    console.log(`\n  Component tree structure (first snapshot):`);
    const fibers = rootData.snapshots[0];
    const componentTypes = {};

    fibers.forEach(fiber => {
      if (fiber.displayName) {
        componentTypes[fiber.displayName] = (componentTypes[fiber.displayName] || 0) + 1;
      }
    });

    const sortedComponents = Object.entries(componentTypes).sort((a, b) => b[1] - a[1]);
    console.log(`    Unique components: ${sortedComponents.length}`);
    console.log(`    Total fiber nodes: ${fibers.length}`);

    if (sortedComponents.length > 0) {
      console.log(`\n    Component counts:`);
      sortedComponents.slice(0, 15).forEach(([name, count]) => {
        console.log(`      ${name}: ${count}`);
      });
    }
  }
});

// Look for potential performance issues
console.log('\n\n=== Performance Issues Detected ===\n');

data.dataForRoots.forEach((rootData, rootIndex) => {
  const issues = [];

  // Check for excessive re-renders
  const componentChangeCounts = {};
  rootData.commitData.forEach(commit => {
    if (commit.changeDescriptions) {
      commit.changeDescriptions.forEach(([fiberId, changeDesc]) => {
        componentChangeCounts[fiberId] = (componentChangeCounts[fiberId] || 0) + 1;
      });
    }
  });

  const excessiveRerenders = Object.entries(componentChangeCounts)
    .filter(([_, count]) => count > 10)
    .sort((a, b) => b[1] - a[1]);

  if (excessiveRerenders.length > 0) {
    console.log(`❌ Excessive re-renders detected (Root ${rootIndex + 1}):`);
    excessiveRerenders.forEach(([fiberId, count]) => {
      const fiber = rootData.snapshots?.[0]?.find(f => f.id === parseInt(fiberId));
      const displayName = fiber?.displayName || `Fiber #${fiberId}`;
      console.log(`   ${displayName}: ${count} renders`);
    });
    console.log('');
  }

  // Check average render time
  const durations = rootData.commitData.map(commit => commit.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  if (avgDuration > 16) {
    console.log(`❌ Average render time exceeds 60fps threshold (Root ${rootIndex + 1}):`);
    console.log(`   Average: ${avgDuration.toFixed(2)}ms (target: <16ms)`);
    console.log('');
  }

  // Check for very slow individual commits
  const verySlow = durations.filter(d => d > 50);
  if (verySlow.length > 0) {
    console.log(`❌ Very slow commits detected (>50ms) (Root ${rootIndex + 1}):`);
    console.log(`   Count: ${verySlow.length} / ${durations.length} commits`);
    console.log(`   Slowest: ${Math.max(...verySlow).toFixed(2)}ms`);
    console.log('');
  }
});

console.log('\n=== Analysis Complete ===\n');
