import { describe, expect, it } from 'vitest';
import {
  EDFISICA_AUTO_DESDE, conVersionEdFisica, crearDiasEdFisica, diasEdFisicaEn, sinVersionEdFisica, textoDiasEdFisica, validarDiasEdFisica, versionesEdFisica,
} from './semanas';

describe('días de Ed. Física con fecha de vigencia', () => {
  it('sin nada guardado rigen lunes y viernes desde el 30/10/2026', () => {
    expect(diasEdFisicaEn([], '2026-11-02')).toEqual([1, 5]);
    expect(diasEdFisicaEn(undefined, EDFISICA_AUTO_DESDE)).toEqual([1, 5]);
    expect(diasEdFisicaEn([], '2026-10-29')).toEqual([]); // antes no había Ed. Física automática
  });

  it('un cambio nuevo no altera los días anteriores a su fecha', () => {
    const v = conVersionEdFisica([], '2027-03-01', [1, 3]);
    const ef = crearDiasEdFisica([], v);
    expect(ef.has('2026-11-27')).toBe(true); // viernes de antes del cambio
    expect(ef.has('2027-02-26')).toBe(true); // último viernes antes del cambio
    expect(ef.has('2027-03-01')).toBe(true); // lunes
    expect(ef.has('2027-03-03')).toBe(true); // miércoles nuevo
    expect(ef.has('2027-03-05')).toBe(false); // viernes ya no
  });

  it('aunque la primera versión guardada sea posterior, las semanas intermedias conservan lunes y viernes', () => {
    const v = conVersionEdFisica([], '2026-12-07', [2]);
    const ef = crearDiasEdFisica([], v);
    expect(ef.has('2026-11-30')).toBe(true); // lunes de la semana anterior al cambio
    expect(ef.has('2026-12-08')).toBe(true); // martes nuevo
    expect(ef.has('2026-12-11')).toBe(false);
  });

  it('una versión con la misma fecha que la inicial la reemplaza', () => {
    const v = conVersionEdFisica([], EDFISICA_AUTO_DESDE, [2, 4]);
    expect(diasEdFisicaEn(v, '2026-11-03')).toEqual([2, 4]);
    expect(versionesEdFisica(v)).toHaveLength(1);
  });

  it('la lista vacía deja sin Ed. Física automática, pero los días marcados a mano cuentan', () => {
    const v = conVersionEdFisica([], '2027-03-01', []);
    const ef = crearDiasEdFisica([{ fecha: '2027-03-10', edFisica: true }], v);
    expect(ef.has('2027-03-01')).toBe(false);
    expect(ef.has('2027-03-10')).toBe(true);
  });

  it('quitar un día puntual y los días sin clase siguen mandando', () => {
    const ef = crearDiasEdFisica([{ fecha: '2026-11-02', sinEdFisica: true }, { fecha: '2026-11-06', sinClase: true }]);
    expect(ef.has('2026-11-02')).toBe(false);
    expect(ef.has('2026-11-06')).toBe(false);
    expect(ef.has('2026-11-09')).toBe(true);
  });

  it('ignora versiones mal formadas', () => {
    const v = [{ desde: 'mañana', dias: [1] }, { desde: '2026-12-01' }, null, { desde: '2026-12-07', dias: [3] }];
    expect(versionesEdFisica(v).map((x) => x.desde)).toEqual([EDFISICA_AUTO_DESDE, '2026-12-07']);
  });

  it('conVersion ordena, limpia y reemplaza; sinVersion quita', () => {
    let v = conVersionEdFisica([], '2027-03-01', [5, 1, 1, 3]);
    expect(v).toEqual([{ desde: '2027-03-01', dias: [1, 3, 5] }]);
    v = conVersionEdFisica(v, '2026-12-07', [2]);
    expect(v.map((x) => x.desde)).toEqual(['2026-12-07', '2027-03-01']);
    v = conVersionEdFisica(v, '2027-03-01', [4]);
    expect(v.find((x) => x.desde === '2027-03-01').dias).toEqual([4]);
    expect(sinVersionEdFisica(v, '2027-03-01').map((x) => x.desde)).toEqual(['2026-12-07']);
  });

  it('validarDiasEdFisica', () => {
    expect(validarDiasEdFisica([1, 5])).toBe('');
    expect(validarDiasEdFisica([])).toBe('');
    expect(validarDiasEdFisica([0])).not.toBe(''); // domingo
    expect(validarDiasEdFisica([6])).not.toBe(''); // sábado
    expect(validarDiasEdFisica([1, 1])).not.toBe('');
    expect(validarDiasEdFisica('1,5')).not.toBe('');
  });

  it('textoDiasEdFisica', () => {
    expect(textoDiasEdFisica([1, 5])).toBe('los lunes y viernes');
    expect(textoDiasEdFisica([1, 3, 5])).toBe('los lunes, miércoles y viernes');
    expect(textoDiasEdFisica([3])).toBe('los miércoles');
    expect(textoDiasEdFisica([])).toBe('ningún día de la semana');
  });
});
