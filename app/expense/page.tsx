"use client";

  const save = async () => {
    if (!desc || !amount) return;

    if (editId) {
      await updateDoc(doc(db, "expenses", editId), {
        desc,
        amount: Number(amount),
        category
      });
      setEditId(null);
    } else {
      await addDoc(collection(db, "expenses"), {
        desc,
        amount: Number(amount),
        category,
        date: new Date().toLocaleDateString()
      });
    }

    setDesc("");
    setAmount("");
    setCategory("Food");
  };

  return (
    <div className="p-4">
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold">Expenses</h2>

          <Input placeholder="Description" value={desc} onChange={(e)=>setDesc(e.target.value)} />
          <Input type="number" placeholder="Amount" value={amount} onChange={(e)=>setAmount(e.target.value)} />

          <select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full p-2 mt-2 border">
            <option>Food</option>
            <option>Transport</option>
            <option>Fees</option>
            <option>Airtime</option>
            <option>Other</option>
          </select>

          <Button onClick={save} className="mt-2 w-full">
            {editId ? "Save Edit" : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-4">
          <h2 className="font-bold">History</h2>

          {expenses.map(e => (
            <div key={e.id} className="flex justify-between border-b py-1">
              <span>{e.desc} ({e.category})</span>

              <div className="flex gap-2">
                <span>{e.amount}</span>
                <button
                  onClick={() => {
                    setDesc(e.desc);
                    setAmount(e.amount);
                    setCategory(e.category);
                    setEditId(e.id);
                  }}
                  className="text-blue-500"
                >Edit</button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
