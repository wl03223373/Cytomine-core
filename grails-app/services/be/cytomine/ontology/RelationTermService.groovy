package be.cytomine.ontology

import be.cytomine.ModelService
import be.cytomine.command.relationterm.AddRelationTermCommand
import be.cytomine.command.relationterm.DeleteRelationTermCommand
import be.cytomine.security.User
import grails.converters.JSON

class RelationTermService extends ModelService {

    static transactional = true

    def springSecurityService
    def commandService
    def cytomineService

    def list() {
        RelationTerm.list()
    }

    def list(Relation relation) {
        RelationTerm.findAllByRelation(relation)
    }

    def list(Term term, def position) {
        position == "1" ? RelationTerm.findAllByTerm1(term) : RelationTerm.findAllByTerm2(term)
    }

    def list(Term term) {
        def relation1 = RelationTerm.findAllByTerm1(term);
        def relation2 = RelationTerm.findAllByTerm2(term);
        def all = (relation1 << relation2).flatten();
        return all
    }

    def get(Relation relation, Term term1, Term term2) {
        RelationTerm.findWhere('relation': relation, 'term1': term1, 'term2': term2)
    }



    def add(def json) {
        User currentUser = cytomineService.getCurrentUser()
        commandService.processCommand(new AddRelationTermCommand(user: currentUser), json)
    }

    def update(def json) {
        throw new UnsupportedOperationException("Not supported yet.");
    }


    def delete(def json) {
        User currentUser = cytomineService.getCurrentUser()
        return deleteRelationTerm(json.relation ? json.relation : -1, json.idterm1, json.idterm2, currentUser)
    }

    def deleteRelationTerm(def idRelation, def idTerm1, def idTerm2, User currentUser) {
        return deleteRelationTerm(idRelation, idTerm1, idTerm2, currentUser, true)
    }

    def deleteRelationTerm(def idRelation, def idTerm1, def idTerm2, User currentUser, boolean printMessage) {
        def json = JSON.parse("{relation: $idRelation, term1: $idTerm1, term2: $idTerm2}")
        log.info "json=" + json
        def result = commandService.processCommand(new DeleteRelationTermCommand(user: currentUser, printMessage: printMessage), json)
        return result
    }

    def deleteRelationTermFromTerm(Term term, User currentUser) {
        def relationTerm = RelationTerm.findAllByTerm1OrTerm2(term, term)
        log.info "relationTerm= " + relationTerm.size()

        relationTerm.each { relterm ->
            log.info "unlink relterm:" + relationTerm.id
            deleteRelationTerm(relterm.relation.id, relterm.term1.id, relterm.term2.id, currentUser, false)
        }
    }
}