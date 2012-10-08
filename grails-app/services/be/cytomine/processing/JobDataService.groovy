package be.cytomine.processing

import be.cytomine.Exception.ObjectNotFoundException
import be.cytomine.ModelService
import be.cytomine.command.AddCommand
import be.cytomine.command.DeleteCommand
import be.cytomine.command.EditCommand
import be.cytomine.project.Project
import be.cytomine.security.SecUser
import org.codehaus.groovy.grails.web.json.JSONObject

class JobDataService extends ModelService {

    static transactional = true

    def cytomineService
    def commandService
    def domainService
    def userGroupService
    def springSecurityService

    def list() {
        JobData.list(sort: "id")
    }

    def list(Job job) {
        JobData.findAllByJob(job)
    }

    def read(def id, def cytomineDomain) {
        JobData.read(id)
    }

    def get(def id, def cytomineDomain) {
        Project.get(id)
        JobData
    }

    def add(def json) {
        SecUser currentUser = cytomineService.getCurrentUser()
        return executeCommand(new AddCommand(user: currentUser), json)
    }

    def update(def domain, def json) {
        SecUser currentUser = cytomineService.getCurrentUser()
        return executeCommand(new EditCommand(user: currentUser), json)
    }

    def delete(def domain, def json) {
        SecUser currentUser = cytomineService.getCurrentUser()
        return executeCommand(new DeleteCommand(user: currentUser), json)
    }

    /**
     * Restore domain which was previously deleted
     * @param json domain info

     * @param printMessage print message or not
     * @return response
     */
    def create(JSONObject json, boolean printMessage) {
        create(JobData.createFromDataWithId(json), printMessage)
    }

    def create(JobData domain, boolean printMessage) {
        //Save new object
        domainService.saveDomain(domain)
        //Build response message
        return responseService.createResponseMessage(domain, [domain.id, domain.key, domain.job?.id], printMessage, "Add", domain.getCallBack())
    }
    /**
     * Destroy domain which was previously added
     * @param json domain info

     * @param printMessage print message or not
     * @return response
     */
    def destroy(JSONObject json, boolean printMessage) {
        //Get object to delete
        destroy(JobData.get(json.id), printMessage)
    }

    def destroy(JobData domain, boolean printMessage) {
        //Build response message
        log.info "destroy JobData"
        log.info "createResponseMessage"
        def response = responseService.createResponseMessage(domain, [domain.id, domain.key, domain.job?.id], printMessage, "Delete", domain.getCallBack())
        //Delete object
        log.info "deleteDomain"
        domainService.deleteDomain(domain)
        log.info "response"
        return response
    }

    /**
     * Edit domain which was previously edited
     * @param json domain info
     * @param printMessage print message or not
     * @return response
     */
    def edit(JSONObject json, boolean printMessage) {
        //Rebuilt previous state of object that was previoulsy edited
        edit(fillDomainWithData(new JobData(), json), printMessage)
    }

    def edit(JobData domain, boolean printMessage) {
        //Build response message
        def response = responseService.createResponseMessage(domain,[domain.id, domain.key, domain.job?.id], printMessage, "Edit", domain.getCallBack())
        //Save update
        domainService.saveDomain(domain)
        return response
    }

    /**
     * Create domain from JSON object
     * @param json JSON with new domain info
     * @return new domain
     */
    JobData createFromJSON(def json) {
        return JobData.createFromData(json)
    }

    /**
     * Retrieve domain thanks to a JSON object
     * @param json JSON with new domain info
     * @return domain retrieve thanks to json
     */
    def retrieve(JSONObject json) {
        JobData jobdata = JobData.get(json.id)
        if (!jobdata) throw new ObjectNotFoundException("Jobdata " + json.id + " not found")
        return jobdata
    }


}
