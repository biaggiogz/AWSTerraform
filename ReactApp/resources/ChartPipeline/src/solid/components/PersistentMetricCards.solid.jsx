import { createSignal, createMemo, For, Show, onMount } from 'solid-js';
import { ultraWasmProcessor } from '../wasm/ultra-processor.wasm.js';

const PersistentMetricCards = (props) => {
  const [isVisible, setIsVisible] = createSignal(true);
  const [metricCards, setMetricCards] = createSignal([]);
  const [stateAge, setStateAge] = createSignal(null);
  
  // Ultra-fast reactive computation
  const cardsToShow = createMemo(() => {
    const cards = metricCards().length > 0 
      ? metricCards() 
      : (props.sqlState?.result || []);
    
    // Direct WASM processing for ultra-speed
    return ultraWasmProcessor.processCards(cards);
  });
  
  const removeCard = (cardId) => {
    setMetricCards(cards => cards.filter(c => c.id !== cardId));
  };
  
  // Initialize with props data
  onMount(() => {
    if (props.sqlState?.metricCards) {
      setMetricCards(props.sqlState.metricCards);
    }
    if (props.sqlState?.stateAge) {
      setStateAge(props.sqlState.stateAge);
    }
  });
  
  return (
    <Show when={cardsToShow().length > 0}>
      <div class="p-4 bg-blue-50 rounded-md">
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm font-bold text-blue-700">
            SAVED SQL METRICS ({cardsToShow().length})
          </span>
          <div class="flex items-center gap-2">
            <Show when={stateAge() !== null}>
              <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Saved {stateAge()}m ago
              </span>
            </Show>
            <button
              class="text-blue-600 hover:text-blue-800 p-1 transition-colors"
              onClick={() => setIsVisible(!isVisible())}
              title={isVisible() ? "Hide metrics" : "Show metrics"}
            >
              {isVisible() ? '▲' : '▼'}
            </button>
          </div>
        </div>
        
        <Show when={isVisible()}>
          <div class="flex flex-wrap gap-4">
            <For each={cardsToShow()}>
              {(card) => (
                <MetricCard card={card} onRemove={removeCard} />
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
};

// Ultra-optimized MetricCard component
const MetricCard = (props) => (
  <div class="bg-white border border-blue-200 rounded-md p-3 min-w-[200px] relative shadow-sm hover:shadow-md transition-shadow">
    <div class="flex flex-col gap-2">
      <div class="flex justify-between items-center">
        <span class="text-xs font-bold text-blue-600 uppercase">
          {props.card.title}
        </span>
        <div class="flex items-center gap-1">
          <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            SAVED
          </span>
          <button
            class="text-red-500 hover:text-red-700 p-1 transition-colors"
            onClick={() => props.onRemove(props.card.id)}
            title="Remove card"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div class="text-center">
        <span class="text-2xl font-bold text-blue-600">
          {props.card.formattedValue || props.card.value}
        </span>
      </div>
      
      <span 
        class="text-xs text-gray-500 truncate cursor-help" 
        title={props.card.query}
      >
        Query: {props.card.truncatedQuery || props.card.query}
      </span>
    </div>
  </div>
);

export default PersistentMetricCards;