import { createSignal, For } from 'solid-js';

const PersistentMetricCardsSolid = (props) => {
  const [isVisible, setIsVisible] = createSignal(true);
  
  const cardsToShow = () => 
    props.sqlState.metricCards.length > 0 
      ? props.sqlState.metricCards 
      : (props.sqlState.result || []);

  return (
    <div class="p-1 bg-blue-50 rounded-md">
      <div class="flex justify-between mb-1">
        <span class="text-sm font-bold text-blue-700">
          SAVED SQL METRICS ({cardsToShow().length})
        </span>
        <div class="flex space-x-2">
          {props.sqlState.stateAge !== null && (
            <span class="badge badge-blue text-xs">
              Saved {props.sqlState.stateAge}m ago
            </span>
          )}
          <button 
            onClick={() => setIsVisible(!isVisible())}
            class="btn-xs btn-ghost text-blue-600"
          >
            {isVisible() ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {isVisible() && (
        <div class="flex flex-wrap space-x-4">
          <For each={cardsToShow()}>
            {(card) => (
              <div class="bg-white border border-blue-200 rounded-md p-3 min-w-200">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-bold text-blue-600 uppercase">
                    {card.title}
                  </span>
                  <div class="flex space-x-1">
                    <span class="badge badge-blue text-sm">SAVED</span>
                    <button 
                      onClick={() => props.onRemoveCard(card.id)}
                      class="btn-xs btn-ghost text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div class="text-center">
                  <span class="text-2xl font-bold text-blue-600">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </span>
                </div>
                <span class="text-xs text-gray-500 truncate" title={card.query}>
                  Query: {card.query}
                </span>
              </div>
            )}
          </For>
        </div>
      )}
    </div>
  );
};

export default PersistentMetricCardsSolid;