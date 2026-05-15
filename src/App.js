import { useState } from 'react';

const BUDGET = 100000;

const categories = [
  { id: 'housing', name: '🏠 Жильё', recommended: 30 },
  { id: 'food', name: '🍕 Еда', recommended: 20 },
  { id: 'transport', name: '🚌 Транспорт', recommended: 10 },
  { id: 'entertainment', name: '🎮 Развлечения', recommended: 10 },
  { id: 'savings', name: '💰 Накопления', recommended: 20 },
  { id: 'other', name: '📦 Другое', recommended: 10 },
];

function getScore(values) {
  let score = 0;
  categories.forEach(cat => {
    const percent = (values[cat.id] / BUDGET) * 100;
    const diff = Math.abs(percent - cat.recommended);
    if (diff <= 5) score += 17;
    else if (diff <= 10) score += 8;
  });
  return Math.min(score, 100);
}

async function getAIAdvice(values, score) {
  const summary = categories.map(cat =>
    `${cat.name}: ${((values[cat.id] / BUDGET) * 100).toFixed(0)}% (рекомендуется ${cat.recommended}%)`
  ).join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Ты финансовый ментор для подростков. Пользователь распределил бюджет так:\n${summary}\nОценка: ${score}/100. Дай короткий совет (3-4 предложения) на русском языке. Будь дружелюбным и конкретным.`
      }]
    })
  });

  const data = await response.json();
  return data.content[0].text;
}

function App() {
  const [page, setPage] = useState('home');
  const [values, setValues] = useState({
    housing: 0, food: 0, transport: 0,
    entertainment: 0, savings: 0, other: 0,
  });
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);

  const spent = Object.values(values).reduce((a, b) => a + b, 0);
  const remaining = BUDGET - spent;
  const score = getScore(values);

  function handleChange(id, val) {
    setValues({ ...values, [id]: Number(val) });
  }

  async function handleDone() {
    setPage('result');
    setLoading(true);
    const text = await getAIAdvice(values, score);
    setAdvice(text);
    setLoading(false);
  }

  return (
    <div style={{ fontFamily: 'Arial', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

      {page === 'home' && (
        <div>
          <h1>💰 FinWise</h1>
          <p>Учись управлять деньгами играя!</p>
          <button onClick={() => setPage('budget')}>
            Начать: Месячный бюджет
          </button>
        </div>
      )}

      {page === 'budget' && (
        <div>
          <h2>Месячный бюджет</h2>
          <p>У тебя есть <strong>100 000 ₸</strong> в месяц. Распредели!</p>
          <p>Остаток: <strong>{remaining.toLocaleString()} ₸</strong></p>

          {categories.map(cat => (
            <div key={cat.id} style={{ marginBottom: '15px' }}>
              <label>{cat.name} (рекомендуется: {cat.recommended}%)</label>
              <br />
              <input
                type="range"
                min="0"
                max={BUDGET}
                step="1000"
                value={values[cat.id]}
                onChange={e => handleChange(cat.id, e.target.value)}
              />
              <span> {values[cat.id].toLocaleString()} ₸</span>
            </div>
          ))}

          <button onClick={handleDone} style={{ marginRight: '10px' }}>
            Готово ✅
          </button>
          <button onClick={() => setPage('home')}>Назад</button>
        </div>
      )}

      {page === 'result' && (
        <div>
          <h2>Твой результат</h2>
          <h1>{score}/100 очков</h1>
          {score >= 80 && <p>🏆 Отлично! Ты умеешь управлять деньгами!</p>}
          {score >= 50 && score < 80 && <p>👍 Неплохо! Есть куда расти.</p>}
          {score < 50 && <p>📚 Попробуй ещё раз, следуй рекомендациям!</p>}

          <h3>🤖 Совет от AI ментора:</h3>
          {loading ? <p>Думаю...</p> : <p>{advice}</p>}

          <h3>Твой бюджет:</h3>
          {categories.map(cat => (
            <p key={cat.id}>
              {cat.name}: {values[cat.id].toLocaleString()} ₸
              ({((values[cat.id] / BUDGET) * 100).toFixed(0)}%)
            </p>
          ))}

          <button onClick={() => { setPage('budget'); setAdvice(''); }} style={{ marginRight: '10px' }}>
            Попробовать снова
          </button>
          <button onClick={() => { setPage('home'); setAdvice(''); }}>На главную</button>
        </div>
      )}

    </div>
  );
}

export default App;