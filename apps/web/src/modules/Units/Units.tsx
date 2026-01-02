// apps/web/src/modules/Units/Units.tsx [АКТУАЛЬНО]

// [EVA_FIX]: Импортируем CapabilityType напрямую
import type { CapabilityType } from "@simple-coffeeshop/db";
import { Badge, Button, type Column, GlassCard, Input, Modal, Select, Table } from "@simple-coffeeshop/ui";
import type React from "react";
import { useState } from "react";
import { trpc } from "../../utils/trpc";
import styles from "./Units.module.scss";

type UnitWithEnterprise = {
  id: string;
  name: string;
  address: string | null;
  timezone: string;
  capabilities: CapabilityType[]; // [EVA_FIX]: Используем новый тип
  enterprise: { name: string; id: string } | null;
};

export const Units: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<string>("");
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitAddress, setNewUnitAddress] = useState("");

  const utils = trpc.useUtils();
  const { data: units, isLoading } = trpc.network.listUnits.useQuery();
  const { data: enterprises } = trpc.network.listEnterprises.useQuery();

  const createUnit = trpc.network.createUnit.useMutation({
    onSuccess: () => {
      utils.network.listUnits.invalidate();
      setIsModalOpen(false);
      setNewUnitName("");
      setNewUnitAddress("");
      setSelectedEnterprise("");
    },
  });

  const columns: Column<UnitWithEnterprise>[] = [
    { header: "Название", accessor: "name" },
    { header: "Сеть", accessor: (row) => row.enterprise?.name || "-" },
    { header: "Адрес", accessor: (row) => row.address || "Не указан" },
    {
      header: "Возможности",
      accessor: (row) => (
        <div className={styles.caps}>
          {row.capabilities.map((cap) => (
            <Badge key={cap} variant="primary" size="sm">
              {cap}
            </Badge>
          ))}
        </div>
      ),
    },
    { header: "Часовой пояс", accessor: "timezone" },
  ];

  const enterpriseOptions =
    enterprises?.map((ent) => ({
      label: ent.name,
      value: ent.id,
    })) || [];

  const handleCreate = () => {
    if (!newUnitName || !selectedEnterprise) return;
    createUnit.mutate({
      name: newUnitName,
      enterpriseId: selectedEnterprise,
      address: newUnitAddress,
      capabilities: ["DATA"],
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Реестр объектов</h1>
          <p className={styles.subtitle}>Управление торговыми точками</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Добавить юнит</Button>
      </header>

      <GlassCard className={styles.content}>
        <Table data={units || []} columns={columns} isLoading={isLoading} />
      </GlassCard>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Новая торговая точка">
        <div className={styles.form}>
          <Input label="Название ТТ" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} />
          <Select
            label="Выберите сеть"
            options={enterpriseOptions}
            value={selectedEnterprise}
            onChange={setSelectedEnterprise}
          />
          <Input label="Адрес" value={newUnitAddress} onChange={(e) => setNewUnitAddress(e.target.value)} />
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              // [EVA_FIX]: Используем isPending (React Query v5)
              isLoading={createUnit.isPending}
            >
              Создать
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Units;
